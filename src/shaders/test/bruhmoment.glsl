// http://shadertoy.com/new

struct Sphere
{
    float radius;
    vec3 center;
    vec3 color;
};

struct Cube
{
    float edge;
    vec3 center;
    vec3 color;
};

struct Ray
{
    vec3 origin;
    vec3 direction;
};

struct It
{
    bool ok;  // presence ou non d'une intersection
    vec3 p;   // point d'intersection
    float t;  // distance d'intersection
    vec3 color; // couleur de l'intersection
    vec3 normal; // normal au point d'intersection
};

// renvoie t == 0 si pas d'intersection, sinon l'intersection
// est à ray.origin + t * ray.direction
float intersect(Sphere s, Ray r) {
    vec3 op = s.center - r.origin;
    float t;
    float eps = 1e-4;
    float b = dot(op, r.direction);
    float det = b * b - dot(op, op) + s.radius * s.radius;
    if(det < 0.0) return 0.0;
    else
    {
        det = sqrt(det);
        float t = b - det;
        if(t > eps)
            return t;
        else
        {
            t = b + det;
            if(t > eps)
                return t;
            else
                return 0.0;
        }
    }
}


// Calcule la couleur diffuse en fonction de la direction de la lumière
float Diffuse(in vec3 normal, in vec3 lightDirection)
{
    float scal = dot(normalize(normal), normalize(lightDirection));
    
    scal = max(scal,0.0);

    float d = 0.5 * (1.0 + scal);

    return d * d;
}

const int nbSpheres = 4;
const int nbCubes = 1;

It intersect_scene(Ray r)
{
    Sphere s[nbSpheres];
    Cube c[nbCubes];
    
    vec3 sunlight = vec3(-1.0, -0.5, 1.0);


    // definition de la scene
    s[0].radius = 0.6;
    s[0].center = vec3(0.0, 0.0, 0.0);
    s[0].color = vec3(0.475,0.973,0.624);
    
    s[1].radius = 0.4;
    s[1].center = vec3(1.0, 0.5, 0.0);
    s[1].color = vec3(1.,.0,.0);
    
    s[2].radius = 0.3;
    s[2].center = vec3(-1.0, -0.3, 0.4);
    s[2].color = vec3(0.976,0.553,0.847);
    
    s[3].radius = 0.2;
    s[3].center = vec3(-1.0, 0.5, 2.0);
    s[3].color = vec3(0.976,0.553,0.847);
    
    c[0].edge = 0.5;
    c[0].center = vec3(-1.0, 0.5, 2.0);
    c[0].color = vec3(0.976,0.553,0.847);


    // recherche d'une intersection
    It it;
    it.ok = false;

    for(int i = 0; i < nbSpheres; i++)
    {
        float t2 = intersect(s[i], r);

        // si intersection
        if(t2 != 0.0)
        {
            if(t2 < it.t || !it.ok)
            {
                it.ok = true;
                it.t = t2;

                // calcul de la position et de la normal
                it.p = r.origin + it.t * r.direction;
                it.color = s[i].color * Diffuse(s[i].center - it.p, sunlight);
                if(i == 1){
                    it.color = floor(it.color*3.0)/2.0;
                }

                it.color.b = abs(s[i].center.z);

                it.normal = normalize(it.p - s[i].center);
            }
        }
    }

    for(int i=0; i < nbCubes, i++)
    {

    }

    return it;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    float ratio = iResolution.x / iResolution.y;
    vec2 uv = fragCoord.xy / iResolution.xy * 2.0 - 1.0;

    uv.x *= ratio;

    Ray r;
    r.direction = vec3(0.0, 0.0, 1.0);
    r.origin = vec3(uv.xy, -1.0);

    It it = intersect_scene(r);

    if(it.ok)
    {
        fragColor = vec4(abs(it.color), 1.0);

    }
    else
        fragColor = vec4(mix(vec3(0.686,0.686,0.71),vec3(0.51,0.51,0.89), (uv.y + 1.)/2.), 1.0);
}