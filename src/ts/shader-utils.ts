export class ShaderUtils {

    /**
     * Initialize a shader program, so WebGL knows how to draw our data.
     */
    public static initializeShaderProgram(gl: WebGL2RenderingContext, vertexShaderSource: string, fragmentShaderSource: string): WebGLProgram {
        const vertexShader = ShaderUtils.loadShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = ShaderUtils.loadShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

        // Create the shader program  
        const shaderProgram = gl.createProgram();
        if (shaderProgram === null) {
            throw new Error('Unable to create shader program');
        }
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        // If creating the shader program failed, alert  
        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            throw new Error(`Unable to initialize the shader program: ${gl.getProgramInfoLog(shaderProgram)}`);
        }
        return shaderProgram;
    }

    public static getUniformLocationThrowing(gl: WebGL2RenderingContext, shaderProgram: WebGLProgram, name: string): WebGLUniformLocation {
        const location = gl.getUniformLocation(shaderProgram, name);
        if (location === null) {
            throw new Error(`Failed to obtain the location of the uniform ${name}`);
        }
        return location;
    }

    /**
     * Creates a shader of the given type, uploads the source and compiles it.
     */
    private static loadShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
        const shader = gl.createShader(type);
        if (shader === null) {
            throw new Error(`Unable to create shader of type: ${type}`);
        }

        // Send the source to the shader object
        gl.shaderSource(shader, source);

        // Compile the shader program
        gl.compileShader(shader);

        // See if it compiled successfully
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const message = `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`;
            gl.deleteShader(shader);
            throw new Error(message);
        }
        return shader;
    }
}