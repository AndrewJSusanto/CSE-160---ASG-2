class Sphere {
    constructor() {
        this.type = 'sphere';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.center = [0, 0, 0];
        this.segments = 13;
        this.size = 5;
    }

    render() {
        var rgba = this.color;
        var center = this.center;

        var rotStep = 360 / (this.segments / 2);
        var rotAngle = 0;

        var indices1 = []
        var indices2 = []
        let PI = Math.PI;

        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        var center = this.center;
        
        // Construct circle by segments

        for(let i = 0; i <= this.segments; i++) {
            // Segment area between steps
            let stepOrigin = Math.cos(rotAngle * PI / 180);
            let stepNext = Math.cos((rotAngle + rotStep) * PI / 180);
            stepOrigin += rotStep;
            // Generate two sets of indices along both segments with respect to the sphere's center
            for(var angle = 0; angle <= 360; angle += rotStep) {
                let centerpoint = [center[0], center[1]];
                let angleOrigin = angle;
                let angleStep = angle + rotStep;

                // Generate vectors and then points relative to center position
                let vec1 = [Math.cos(angleOrigin * PI/180), Math.sin(angleOrigin * PI/180)];
                let vec2 = [Math.cos(angleStep * PI/180), Math.sin(angleStep * PI/180)];
                let point1 = [centerpoint[0] + vec1[0],     centerpoint[1] + vec1[1]];
                let point2 = [centerpoint[0] + vec2[0],     centerpoint[1] + vec2[1]];
                
                // Two sets of indices along each curved longitudinal line
                indices1.push([point1[0], point1[1], stepOrigin]);
                indices2.push([point2[0], point2[1], stepNext]);
            }


        }

        for(let x = 0; x < indices1.length - 1; x++) {
            drawTriangle3D( [indices1[x][0],    indices1[x][1],     indices1[x][2],
                             indices1[x+1][0],  indices1[x+1][1],   indices1[x+1][2],
                             indices2[x][0],    indices2[x][1],     indices2[x][2]
                            ]);
            drawTriangle3D( [indices2[x][0],    indices2[x][1],     indices2[x][2],
                             indices2[x+1][0],  indices2[x+1][1],   indices2[x+1][2],
                             indices1[x+1][0],  indices1[x+1][1],   indices1[x+1][2]
                            ]);
            
        }
    }
}