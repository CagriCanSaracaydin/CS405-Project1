function multiplyMatrices(matrixA, matrixB) {
    var result = [];

    for (var i = 0; i < 4; i++) {
        result[i] = [];
        for (var j = 0; j < 4; j++) {
            var sum = 0;
            for (var k = 0; k < 4; k++) {
                sum += matrixA[i * 4 + k] * matrixB[k * 4 + j];
            }
            result[i][j] = sum;
        }
    }

    // Flatten the result array
    return result.reduce((a, b) => a.concat(b), []);
}
function createIdentityMatrix() {
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);
}
function createScaleMatrix(scale_x, scale_y, scale_z) {
    return new Float32Array([
        scale_x, 0, 0, 0,
        0, scale_y, 0, 0,
        0, 0, scale_z, 0,
        0, 0, 0, 1
    ]);
}

function createTranslationMatrix(x_amount, y_amount, z_amount) {
    return new Float32Array([
        1, 0, 0, x_amount,
        0, 1, 0, y_amount,
        0, 0, 1, z_amount,
        0, 0, 0, 1
    ]);
}

function createRotationMatrix_Z(radian) {
    return new Float32Array([
        Math.cos(radian), -Math.sin(radian), 0, 0,
        Math.sin(radian), Math.cos(radian), 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ])
}

function createRotationMatrix_X(radian) {
    return new Float32Array([
        1, 0, 0, 0,
        0, Math.cos(radian), -Math.sin(radian), 0,
        0, Math.sin(radian), Math.cos(radian), 0,
        0, 0, 0, 1
    ])
}

function createRotationMatrix_Y(radian) {
    return new Float32Array([
        Math.cos(radian), 0, Math.sin(radian), 0,
        0, 1, 0, 0,
        -Math.sin(radian), 0, Math.cos(radian), 0,
        0, 0, 0, 1
    ])
}

function getTransposeMatrix(matrix) {
    return new Float32Array([
        matrix[0], matrix[4], matrix[8], matrix[12],
        matrix[1], matrix[5], matrix[9], matrix[13],
        matrix[2], matrix[6], matrix[10], matrix[14],
        matrix[3], matrix[7], matrix[11], matrix[15]
    ]);
}

const vertexShaderSource = `
attribute vec3 position;
attribute vec3 normal; // Normal vector for lighting

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 normalMatrix;

uniform vec3 lightDirection;

varying vec3 vNormal;
varying vec3 vLightDirection;

void main() {
    vNormal = vec3(normalMatrix * vec4(normal, 0.0));
    vLightDirection = lightDirection;

    gl_Position = vec4(position, 1.0) * projectionMatrix * modelViewMatrix; 
}

`

const fragmentShaderSource = `
precision mediump float;

uniform vec3 ambientColor;
uniform vec3 diffuseColor;
uniform vec3 specularColor;
uniform float shininess;

varying vec3 vNormal;
varying vec3 vLightDirection;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(vLightDirection);
    
    // Ambient component
    vec3 ambient = ambientColor;

    // Diffuse component
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * diffuseColor;

    // Specular component (view-dependent)
    vec3 viewDir = vec3(0.0, 0.0, 1.0); // Assuming the view direction is along the z-axis
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
    vec3 specular = spec * specularColor;

    gl_FragColor = vec4(ambient + diffuse + specular, 1.0);
}

`

/**
 * @WARNING DO NOT CHANGE ANYTHING ABOVE THIS LINE
 */



/**
 *
 * @TASK1 Calculate the model view matrix by using the chatGPT
 */

function getChatGPTModelViewMatrix() {
    const transformationMatrix = new Float32Array([
        // Column 1
        0.1767767,  // M00
        0.3061862,  // M10
        -0.3535534, // M20
        0,          // M30

        // Column 2
        -0.2866117, // M01
        0.3695995,  // M11
        0.1767767,  // M21
        0,          // M31

        // Column 3
        0.7391989,  // M02
        0.28033,    // M12
        0.6123724,  // M22
        0,          // M32

        // Column 4
        0.3,        // M03
        -0.25,      // M13
        0,          // M23
        1           // M33
    ]);
    return getTransposeMatrix(transformationMatrix);
}

/**
 *
 * @TASK2 Calculate the model view matrix by using the given
 * transformation methods and required transformation parameters
 * stated in transformation-prompt.txt
 */

function getModelViewMatrix() {
    // tranlation, scaling, rotation matrix
    const translationMatrix = createTranslationMatrix(0.3, -0.25, 0);
    const scalingMatrix = createScaleMatrix(0.5, 0.5, 1);
    const rotationXMatrix = createRotationMatrix_X(Math.PI / 6); // takes radian 180/6 = 30 degrees
    const rotationYMatrix = createRotationMatrix_Y(Math.PI / 4); // 45 degrees
    const rotationZMatrix = createRotationMatrix_Z(Math.PI / 3); // 60 degrees

    // following the correct transformation order, rotate, scale, and translate
    let modelViewMatrix = multiplyMatrices(rotationZMatrix, rotationYMatrix); // Rz * Ry starting from right to left
    modelViewMatrix = multiplyMatrices(modelViewMatrix, rotationXMatrix);    // (Rz * Ry) * Rx
    modelViewMatrix = multiplyMatrices(modelViewMatrix, scalingMatrix);      // ((Rz * Ry) * Rx) * S
    modelViewMatrix = multiplyMatrices(translationMatrix, modelViewMatrix);  // T * ((Rz * Ry) * Rx * S)

    return modelViewMatrix;
}

/**
 * 
 * @TASK3 Ask CHAT-GPT to animate the transformation calculated in 
 * task2 infinitely with a period of 10 seconds. 
 * First 5 seconds, the cube should transform from its initial 
 * position to the target position.
 * The next 5 seconds, the cube should return to its initial position.
 */

function getPeriodicMovement(startTime) {
    // Current time in seconds
    const currentTime = (Date.now() - startTime) / 1000;

    // Define the total period and half period in seconds
    const totalPeriod = 10;
    const halfPeriod = totalPeriod / 2;

    // Calculate the elapsed time within the current period
    const elapsedTime = currentTime % totalPeriod;

    let progress;

    if (elapsedTime < halfPeriod) {
        // First 5 seconds: Transition from initial to target transformation
        progress = elapsedTime / halfPeriod; // Ranges from 0 to 1
    } else {
        // Last 5 seconds: Transition back to initial position
        progress = 1 - ((elapsedTime - halfPeriod) / halfPeriod); // Ranges from 1 to 0
    }

    // Retrieve the target transformation matrix from Task 2
    const targetMatrix = getModelViewMatrix();

    // Define the initial (identity) matrix
    const initialMatrix = createIdentityMatrix();

    // Initialize the interpolated matrix
    const interpolatedMatrix = new Float32Array(16);

    // Linearly interpolate between the initial and target matrices
    for (let i = 0; i < 16; i++) {
        interpolatedMatrix[i] = initialMatrix[i] * (1 - progress) + targetMatrix[i] * progress;
    }

    return interpolatedMatrix;
}

