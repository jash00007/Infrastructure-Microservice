// simulate.js
function getRandom(min, max) {
    return Math.random() * (max - min) + min;
  }
  
  function simulateServerLoad(labs) {
    let cpu = getRandom(5, 15);
    let mem = getRandom(10, 20);
    let disk = getRandom(5, 10);
  
    for (const lab of labs) {
      if (lab.status === 'active') {
        if (lab.name.toLowerCase().includes('heap') || lab.name.toLowerCase().includes('cpu')) {
          cpu += getRandom(20, 30);
        } else if (lab.name.toLowerCase().includes('memory') || lab.name.toLowerCase().includes('paging')) {
          mem += getRandom(25, 35);
        } else {
          cpu += getRandom(10, 15);
          mem += getRandom(10, 20);
        }
        disk += getRandom(3, 6);
      }
    }
  
    return {
      cpu: Math.min(cpu, 100),
      memory: Math.min(mem, 100),
      disk: Math.min(disk, 100)
    };
  }
  
  module.exports = { simulateServerLoad };
  