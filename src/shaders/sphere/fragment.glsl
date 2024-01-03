uniform float uTime;
uniform float uBiome;

varying vec2 vUv;
varying vec3 vEle;

vec3 palette( float t ) {
    
    vec3 a = vec3(1.0, 0.83, 0.092);
    vec3 b = vec3(1.0, 0.16, 0.46);
    vec3 c = vec3(0.95, 0.13, 1.0);
    vec3 d = vec3(0.55,0.12,1.0);

    return a + b*cos( 6.28318*(c*t+d) );
}

void main()
{

    vec4 color = vec4 (vUv.y,0.0,0.7,1.0);

    if(uBiome == 0.0){
        color = vec4 (vUv.y/3.2,0.0,1.,1.);
    }
    else if(uBiome == 1.0){
                float d = length(vUv-0.5) - 0.25; // signed distance value
        bool outside = d > 0.; // true if outside

        vec4 col = vec4(step(0.0, -d));

        float glow = 0.07/d; // create glow and diminish it with distance
        glow = clamp(glow, 0., 1.); // remove artifacts

        col += glow; // add glow

        vec3 downColor = vec3 (0.992,0.82,0.806);//vec3 (0.992,0.82,0.806);
        vec3 upColor = vec3 (0.976,0.549,0.604);//vec3 (0.976,0.549,0.604);
        vec4 mixed = vec4 (mix(downColor, upColor,vUv.y+0.1),1.0);
        col*= mixed;
        if(col.a <= 0.99) col = mix( vec4(0.886,0.306,0.106,1.),mixed,clamp(col.a-0.5,0.,1.));

        color = col;
    }
    else if(uBiome == 2.0){
        color = vec4 (0.761,0.075,0.012,1.0);
    }
    else if(uBiome == 3.0){
        //color = vec4 (0.475,0.973,0.624,1.0);
        float d = length(vUv-0.5) - 0.25; // signed distance value
        bool outside = d > 0.; // true if outside

        vec4 col = vec4(step(0.0, -d));

// 0.976,0.553,0.847
        float glow = 0.07/d; // create glow and diminish it with distance
        glow = clamp(glow, 0., 1.); // remove artifacts

        col += glow; // add glow

        col *= vec4(0.475,0.973,0.624,1.); // add color
        if(col.a <= 0.99) col = mix( vec4(0.976,0.553,0.847,1.),vec4(0.475,0.973,0.624,1.),clamp(col.a-0.5,0.,1.));


        color = col; // output color
    }
    else if(uBiome == 4.0){
        float d = length(vUv-0.5) - 0.25; // signed distance value
        bool outside = d > 0.; // true if outside

        vec4 col = vec4(step(0.0, -d));

        float glow = 0.07/d; // create glow and diminish it with distance
        glow = clamp(glow, 0., 1.); // remove artifacts

        col += glow; // add glow

        vec3 downColor = vec3 (0.992,0.82,0.806);//vec3 (0.992,0.82,0.806);
        vec3 upColor = vec3 (0.976,0.549,0.604);//vec3 (0.976,0.549,0.604);
        vec4 mixed = vec4 (mix(downColor, upColor,vUv.y+0.1),1.0);
        col*= mixed;
        if(col.a <= 0.99) col = mix( vec4(0.549,0.604,0.976,1.),mixed,clamp(col.a-0.5,0.,1.));

        color = col;
    }
    else if(uBiome == 5.0){

        vec2 norUv = (-1.0 + 2.0 *vUv)*1.6;
        vec3 light_color = vec3(0.9, 0.25, 0.25);
        float light = 0.1 / distance(normalize(norUv),norUv)-0.11;
        vec3 bg = vec3(0.584,0.,0.);
        
        if(length(norUv) < 1.0){
            light *= .002 / distance(normalize(norUv), norUv);
            bg.r = 0.;
        }

        color = vec4(mix(bg,light_color,light), 1.0);
    }

    

    gl_FragColor = color;
}