const canvas = document.getElementById('mapCanvas'); // get the canvas element
const ctx_canvas = canvas.getContext('2d'); // get the context of the canvas(2 dimensional)

const houseImage = new Image(); // create a new image object
houseImage.src = "casa.png"; // set the source of the image

let selectedHouse = null; // set the selected house to null

houseImage.onload = async function() { // function to load the houses from the json file
    try{
        const response = await fetch("houses.json"); // fetch the houses.json file
        const data = await response.json(); // get the json data

        drawRoads(data.houses, data.roads); // draw the roads on the canvas
        drawAllHouses(data.houses); // draw the houses on the canvas

        canvas.addEventListener('click', function(event){
            const { offsetX, offsetY } = event; // get the x and y coordinates of the click

            const houseIndex = checkHouseClicked(data.houses, offsetX, offsetY); // check if a house was clicked
            if(houseIndex !== null){
                selectedHouse = houseIndex;
                
                console.log("House selected: ", selectedHouse); // log the selected house
                
                ctx_canvas.clearRect(0, 0, canvas.width, canvas.height); // clear the canvas

                const edges = primMST(data.houses, data.roads, selectedHouse); // get the parent array
                
                console.log("Parents: ", edges); // log the parents array
                
                drawRoads(data.houses, data.roads); // draw the roads on the canvas
                drawAllHouses(data.houses); // draw the houses on the canvas
                
                const minTime = drawMST(data.houses, data.roads, edges, (totalTime) => {
                    ctx_canvas.fillStyle = "black"; // set the color of the text to black
                    ctx_canvas.font = "italic bold 16px Times New Roman"; // set the font of the text
                    ctx_canvas.fillText(`Total time: ${totalTime}s`, 10, 20); // draw the total time on the canvas
                });
            }
            else{
                console.log("No house selected");
            }
        })

    } catch (error) {
        console.error("Error while loading the houses: ", error); // log the error
    }
};

function drawAllHouses(houses){ // draw the houses on the canvas
    
    houses.forEach((house, index) => { // for each house in the json file
        const isSelected = index === selectedHouse; // check if the house is selected
        drawHouse(house.x, house.y, isSelected); // draw the house on the canvas
    });
}

function drawHouse(x, y, isSelected){ // draw the house on the canvas
    const width = isSelected ? 100 : 80; // set the width of the house
    const height = isSelected ? 100 : 80; // set the height of the house
    x = isSelected ? x - 10 : x; // set the x coordinate of the house
    y = isSelected ? y - 10 : y; // set the y coordinate of the house

    ctx_canvas.drawImage(houseImage, x, y, width, height); // draw the house on the canvas
}

function checkHouseClicked(houses, x, y){ // check if a house was clicked
    for(let i = 0; i < houses.length; i++){ // for each house in the json file
        const house = houses[i]; // get the house
        if(x>=house.x && x<=house.x+80 && y>=house.y && y<=house.y+80) // if the click is inside the house
            return i; // return the index of the house
    }
    return null; // return null if no house was clicked
}

function drawRoads(houses, roads){ // draw the roads on the canvas
    ctx_canvas.strokeStyle = "grey"; // set the color of the roads to black
    ctx_canvas.lineWidth = 5; // set the width of the roads to 2

    roads.forEach(road => { // for each road in the json file
        const houseFrom = houses[road.from];
        const houseTo = houses[road.to];

        ctx_canvas.beginPath(); // begin the path
        ctx_canvas.moveTo(houseFrom.x + 40, houseFrom.y + 40); // move to the center of the houseFrom
        ctx_canvas.lineTo(houseTo.x + 40, houseTo.y + 40); // draw a line to the center of the houseTo
        ctx_canvas.stroke(); // draw the line

        ctx_canvas.fillStyle = "black"; // set the color of the text to black
        ctx_canvas.font = "italic bold 16px Times New Roman"; // set the font of the text
        ctx_canvas.fillText(`Time: ${road.time}s`, // set the text to the time of the road
            (houseFrom.x + houseTo.x) / 2 + 25, 
            (houseFrom.y + houseTo.y) / 2 + 25 // draw the text with the time between the two houses
        );
    });
};

function primMST(houses, roads, selectedHouse){
    const n = houses.length; // get the number of houses
    const inMST = new Array(n).fill(false); // create an array of n elements, all set to false
    const minEdge = new Array(n).fill(Infinity); // create an array of n elements, all set to Infinity
    const parent = new Array(n).fill(-1); // create an array of n elements, all set to -1
    const minHeap = [{node: selectedHouse, cost: 0}]; // create a min heap with the selected house and cost 0
    const edges = []; // create an array of edges
    
    parent[selectedHouse] = selectedHouse; // set the parent of the selected house to itself

    minEdge[selectedHouse] = 0; // set the minimum edge of the selected house to 0

    while(minHeap.length>0){
        minHeap.sort((a,b) => a.cost - b.cost); // sort the heap by cost
        let minCost=minHeap[0].cost; // get the cost of the top of the heap
        const { node: heapTop } = minHeap.shift(); // gets top of heap and removes it
        
        if(inMST[heapTop]) continue; // if the node is already in the MST, continue
        
        inMST[heapTop] = true; // set the node to be in the MST
        
        edges.push({from: parent[heapTop], to: heapTop, cost: minCost}); // push the parent of the heapTop and the heapTop to the edges array
        
        roads.forEach(road => { // for each road in the json file
            if(road.from === heapTop && !inMST[road.to] && road.time < minEdge[road.to]){ // if the road is not in the MST and the time is less than the minimum edge
                minEdge[road.to] = road.time; // set the minimum edge to the time of the road
                parent[road.to] = road.from; // set the parent of the road
                minHeap.push({node: road.to, cost: road.time}); // push the road to the heap
            }
            else if(road.to === heapTop && !inMST[road.from] && road.time < minEdge[road.from]){ // if the road is not in the MST and the time is less than the minimum edge
                minEdge[road.from] = road.time; // set the minimum edge to the time of the road
                parent[road.from] = road.to; // set the parent of the road
                minHeap.push({node: road.from, cost: road.time}); // push the road to the heap
            }
        } 
        )
        
    }
    return edges; // return the parent array
}

function drawMST(houses, roads, edges, callback){ // draw the MST on the canvas
    ctx_canvas.strokeStyle = "red"; // set the color of the roads to red
    ctx_canvas.lineWidth = 5; // set the width of the roads to 5

    let totalTime = 0; // set the total time to 0

    function drawEdge(index){
        if (index < edges.length) // check if there are edges left to draw
        {
            const edge = edges[index]; // get the edge
            const houseFrom = houses[edge.from]; // get the houseFrom
            const houseTo = houses[edge.to]; // get the houseTo
            totalTime += edge.cost; // add the cost of the edge to the total time

            ctx_canvas.beginPath(); // begin the path
            ctx_canvas.moveTo(houseFrom.x + 40, houseFrom.y + 40); // move to the center of the houseFrom
            ctx_canvas.lineTo(houseTo.x + 40, houseTo.y + 40); // draw a line to the center of the houseTo
            ctx_canvas.stroke(); // draw the line

            setTimeout(() => drawEdge(index + 1), 600); // draw the next edge after 1 second
            drawAllHouses(houses); // draw the houses on the canvas
        } else {
            callback(totalTime); // call the callback function with the total time
        }
    }
    drawEdge(0); // draw the first edge
    }

window.onload = houseImage.onload; // when the window is loaded, load the houses