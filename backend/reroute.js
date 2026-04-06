/**
 * Advanced Rerouting Engine
 */

function shiftBox(box, dir, dist){

 return {

  min:{
   x:box.min.x + dir.x*dist,
   y:box.min.y + dir.y*dist,
   z:box.min.z + dir.z*dist
  },

  max:{
   x:box.max.x + dir.x*dist,
   y:box.max.y + dir.y*dist,
   z:box.max.z + dir.z*dist
  }

 };

}

function checkCollision(testBox, elements, ignoreId){

 for(const e of elements){

  if(e.id === ignoreId) continue;

  const b = e.boundingBox;

  if(
   testBox.min.x <= b.max.x &&
   testBox.max.x >= b.min.x &&
   testBox.min.y <= b.max.y &&
   testBox.max.y >= b.min.y &&
   testBox.min.z <= b.max.z &&
   testBox.max.z >= b.min.z
  ){

   return true;

  }

 }

 return false;

}

function computeReroute(clashes, elements){

 const directions = [
  {x:1,y:0,z:0},
  {x:-1,y:0,z:0},
  {x:0,y:1,z:0},
  {x:0,y:-1,z:0},
  {x:0,y:0,z:1},
  {x:0,y:0,z:-1}
 ];

 const DEFAULT_DIST = 600;
 const reroutedElements = [];
 const updatedElements = [...elements];

 for(const clash of clashes){
   const suggestion = clash.suggestedReroute;
   const moveId = suggestion?.elementId || clash.elementA?.id;
   const element = updatedElements.find(e => e.id === moveId);

   if(!element) continue;

   const originalBox = element.boundingBox;
   let best = null;
   let distance = suggestion?.offsetDistance || DEFAULT_DIST;
   let direction = { x: 0, y: 0, z: 0 };
   let newBox = suggestion?.suggestedBox || null;

   if(newBox){
     const dx = newBox.min.x - originalBox.min.x;
     const dy = newBox.min.y - originalBox.min.y;
     const dz = newBox.min.z - originalBox.min.z;
     direction = {
       x: Math.sign(dx),
       y: Math.sign(dy),
       z: Math.sign(dz)
     };

     if(checkCollision(newBox, updatedElements, element.id)){
       newBox = null;
     }
   }

   if(!newBox){
     for(const dir of directions){
       const testBox = shiftBox(originalBox, dir, distance);
       if(!checkCollision(testBox, updatedElements, element.id)){
         best = { direction: dir, newBox: testBox };
         break;
       }
     }
   } else {
     best = { direction, newBox };
   }

   if(best){
     element.boundingBox = best.newBox;
     reroutedElements.push({
       elementId: element.id,
       oldBoundingBox: suggestion?.originalBox || originalBox,
       newBoundingBox: best.newBox,
       direction: best.direction,
       distance: distance,
       status: "rerouted"
     });
   }
 }

 return {
  updatedElements,
  reroutedElements
 };
}

module.exports={
 computeReroute
};