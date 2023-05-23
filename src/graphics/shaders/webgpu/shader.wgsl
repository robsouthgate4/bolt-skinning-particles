
struct ViewData {
    view: mat4x4<f32>,
    projection: mat4x4<f32>,
};

struct NodeData {
    model: mat4x4<f32>,
    normal: mat4x4<f32>,
    modelViewProjection: mat4x4<f32>,
}

struct UniformData {
    color1: vec4<f32>,
    color2: vec4<f32>,
    color3: vec4<f32>,
}

@group(0) @binding(0) var<uniform> viewData: ViewData;
@group(1) @binding(0) var<uniform> nodeData: NodeData;
@group(2) @binding(0) var<uniform> uniformData: UniformData;

struct VSInput {
    @location(0) position: vec4f,
    //@location(1) normal: vec4f,
};

struct VSOutput {
    @builtin(position) position: vec4f,
};
  
@vertex
fn vsMain(v: VSInput) -> VSOutput {
    var output : VSOutput;

    //output.normal = v.normal;

    output.position = viewData.projection * viewData.view * nodeData.model * v.position;

    return output;
};
    
@fragment
fn fsMain(v: VSOutput) -> @location(0) vec4<f32> {
    return vec4(1.0);
};