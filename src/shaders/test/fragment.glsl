uniform float uTime;
uniform float uBiome;
uniform bool uMusic;

varying vec2 vUv;
varying vec3 vEle;

vec3 palette( float t ) {
    
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.263,0.416,0.557);

    return a + b*cos( 6.28318*(c*t+d) );
}

void main()
{

    vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
    vec4 otherColor = vec4(0.0, 0.0, 0.0, 1.0);
    float opacity = 1.0;

    //First biome
    if(uBiome == 0.0){
        color = vec4(1.0, 0.0, 0.0, 1.0);

        otherColor = vec4(vEle.z/2.8,0.0,0.2,1.);

        //opacity = clamp(1.-vUv.y*vUv.y*vUv.y*vUv.y*vUv.y,0.,1.) * vUv.y;



    }
    
    //Second biome
    else if(uBiome == 1.0){
        color = vec4(0.761,0.075,0.012, 1.0);
        vec4 color1 = vec4(0.616,0.341,0.443,0.75);
        vec4 color2 = vec4(0.945,0.749,0.643,0.85);
        otherColor = vec4(mix(color1, color2, vEle.z*2.5));
        opacity = vUv.y;
    }

    //Third biome
    else if(uBiome == 2.0){
        color = vec4(0.761,0.075,0.012, 1.0);
        vec4 color1 = vec4(0.004,0.023,0.096,1.);
        vec4 color2 = vec4(0.761,0.075,0.012,1.);
        otherColor = vec4(mix(color1, color2, vEle.z*2.5));
        opacity = clamp(1.-vUv.y*vUv.y*vUv.y*vUv.y*vUv.y,0.,1.);

    }

        //Fourth biome
    else if(uBiome == 3.0){
        color = vec4(0.475,0.973,0.624,1.0);

        float modEle = vEle.z;

        otherColor = vec4(mix(vec3(0.553,0.635,0.976), vec3(0.82,0.906,0.992), modEle *1.2),1.0);
    }

    //Fifth biome
    else if(uBiome == 4.0){
        color = vec4(0.992,0.82,0.806,1.0);

        otherColor = vec4(mix(vec3(0.553,0.635,0.976), vec3(0.82,0.906,0.992), vEle.z *1.2),1.0);
    }

    //Sixth biome
    else if(uBiome == 5.0){
        color = vec4(0.584,0.,0.,1.0);


        otherColor = vec4(mix( vec3(0.25,0.,0.),vec3(0.0,0.0,0.0), vEle.z*2.),1.0);
        //otherColor = vec4(mix( vec3(0.718,0.231,0.235),vec3(0.118,0.024,0.024), distance(vec2(vUv.x, (vUv.y - 0.5) * .15 + 0.60),vec2(0.5,0.5))*12.),1.0);
    }
    
    if(vEle.x > .25 || vEle.x < -.25) {

        color = otherColor;

    }
    gl_FragColor = color;
    gl_FragColor.a = opacity;
}