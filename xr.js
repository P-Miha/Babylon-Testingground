const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas,true);
var createScene = async function () {
    // This creates a basic Babylon Scene object (non-mesh)
    var scene = new BABYLON.Scene(engine);

    // This creates and positions a free camera (non-mesh)
    var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 2, -10), scene);

    // Creating Env for XR
    var env = scene.createDefaultEnvironment();

    // This targets the camera to scene origin
    camera.setTarget(BABYLON.Vector3.Zero());

    // This attaches the camera to the canvas
    camera.attachControl(canvas, true);

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.7;

    // Enable Physics
    scene.enablePhysics(undefined, new BABYLON.AmmoJSPlugin());

    //Shadows
    //const shadowGenerator = new BABYLON.ShadowGenerator(1024, light);
    //shadowGenerator.useBlurExponentialShadowMap = true;
    //shadowGenerator.blurKernel = 32;


    // Our built-in 'sphere' shape.
    const sphere = BABYLON.MeshBuilder.CreateSphere("grab_sphere", {diameter: 1, segments: 32}, scene);
    sphere.isPickable = true;
    // Move the sphere upward 1/2 its height
    sphere.position.y = 1;
    sphere.physicsImpostor = new BABYLON.PhysicsImpostor(sphere, BABYLON.PhysicsImpostor.SphereImpostor, { 
        mass: 0, 
        restitution: 0.5
        });


    const sphere2 = BABYLON.MeshBuilder.CreateSphere("grab_sphere", {diameter: 1, segments: 32}, scene);
    sphere2.isPickable = true;
    // Move the sphere upward 1/2 its height
    sphere2.position.x = 2;
    sphere2.position.y = 1;
    sphere2.physicsImpostor = new BABYLON.PhysicsImpostor(sphere2, BABYLON.PhysicsImpostor.SphereImpostor, { 
        mass: 0, 
        restitution: 0.5
        });

    // Our built-in 'ground' shape.
    const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 30, height: 30, disableBidirectionalTransformation: true }, scene);
    const groundMaterial = new BABYLON.GridMaterial("groundMaterial", scene);
    ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, {
        mass: 0,
        restitution: 0.5,
        friction: 0.7
    });
    groundMaterial.gridRatio = 0.1;
    groundMaterial.opacity = 0.9;
    groundMaterial.lineColor = "#fc0324";
    ground.material = groundMaterial;


    // Start XR

    // Starting XR-Helper
    const xrHelper = await scene.createDefaultXRExperienceAsync({floorMeshes: [env.ground]});
    const featureManager = xrHelper.baseExperience.featuresManager;
    featureManager.enableFeature(BABYLON.WebXRFeatureName.HAND_TRACKING, "latest", {
        xrInput: xrHelper.input,
    }, true, false);

    // Control: Grabbing-Logic

    var currentlyGrabbing = (grabbing, controller) => {
        if (grabbing) {
            var grabable = scene.getMeshesById("grab_sphere");
            grabable.forEach((d) =>{
                if (d.intersectsMesh(controller)){
                    d.setParent(controller);
                }
            });
        } else {
            var grabable = scene.getMeshesById("grab_sphere");
            grabable.forEach((d) => {
                if (d.parent == controller) {
                    d.setParent(null);
                }
            })
        }
    }

    // Control: Grabbing, execute via Squeeze

    xrHelper.input.onControllerAddedObservable.add((controller) => {
        controller.onMeshLoadedObservable.addOnce((rootMesh) => {
            //shadowGenerator.addShadowCaster(rootMesh, true);
        });
        controller.onMotionControllerInitObservable.add(() => {
            const squeeze = controller.motionController.getComponentOfType("squeeze");
            [squeeze].forEach((component) => {
                if (!component) {
                    return;
                }
                component.onButtonStateChangedObservable.add(() => {
                    if (component.changes.pressed){
                        currentlyGrabbing(component.pressed, controller.pointer);
                    }
                })
            })
        });
    });

        
    // XR-Loop per XR-Frame
  



    return scene;
};
const scene = createScene();

scene.then(()=>{
	engine.runRenderLoop(function () {
		if (scene) {
			scene.render();
		}
	});
})
window.addEventListener("resize", function () {
    engine.resize();
}
);