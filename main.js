const font = new Font("default");
Screen.setParam(Screen.DEPTH_TEST_ENABLE, false);
Screen.setVSync(true);
Screen.setFrameCounter(true);

// Variables y config
let numSimulations = 100;
let homeTeam = "Local";
let awayTeam = "Rival";
let homeXG = 0.0;
let awayXG = 0.0;

let inputBuffer = ""; 
let countHomeWins = 0;
let countAwayWins = 0;
let countDraws = 0;
let scoreMat = [];

let seed = 123456;
function rand() {
    seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
}
function poisson(lambda) {
    let L = Math.exp(-lambda);
    let k = 0;
    let p = 1.0;
    do { k++; p *= rand(); } while (p > L);
    return k - 1;
}
function round2(x) { return Math.round(x * 100) / 100; }

let stage = -1; 
let running = true;

let prevCross = false;
let lastClickTime = 0;
const clickCooldown = 250; 
let lastNavTime = 0;
const navCooldown = 150; 

let cursor = 0;
const keys = [["1","2","3"],["4","5","6"],["7","8","9"],[".","0","<"],["OK"]];

// Teclado virtual
function drawKeyboard(sw, sh) {
    let keyW = sw * 0.08;
    let keyH = sh * 0.07;
    let gapX = sw * 0.015; 
    let gapY = sh * 0.015;

    let totalKbdW = (3 * keyW) + (2 * gapX);
    let startX = (sw - totalKbdW) / 2;
    let startY = sh * 0.45;

    for (let r=0; r<5; r++) {
        for (let c=0; c<3; c++) {
            if (keys[r][c] === undefined) continue;
            
            let text = keys[r][c];
            let x = startX + c * (keyW + gapX);
            let y = startY + r * (keyH + gapY);
            let currentW = (text === "OK") ? totalKbdW : keyW;

            let bgColor = (cursor === r*3+c) ? Color.new(0,200,80,220) : Color.new(45,45,45,200);
            Draw.rect(x, y, currentW, keyH, bgColor);
            font.print(x + (currentW * 0.35), y + (keyH * 0.25), text);
        }
    }
}

const pad = Pads.get(0);

// Bucle principal
Screen.display(() => {
    pad.update();
    Screen.clear();

    let sw = Screen.width || 640;
    let sh = Screen.height || 480;
    let now = Date.now();

    if (now - lastNavTime > navCooldown) {
        if (pad.pressed(Pads.UP)) { cursor = Math.max(0, cursor-3); lastNavTime = now; }
        if (pad.pressed(Pads.DOWN)) { cursor = Math.min(keys.flat().length-1, cursor+3); lastNavTime = now; }
        if (pad.pressed(Pads.LEFT)) { cursor = Math.max(0, cursor-1); lastNavTime = now; }
        if (pad.pressed(Pads.RIGHT)) { cursor = Math.min(keys.flat().length-1, cursor+1); lastNavTime = now; }
    }

    let currentCross = pad.pressed(Pads.CROSS);
    if (currentCross && !prevCross && (now - lastClickTime > clickCooldown)) {
        lastClickTime = now;
        let key = keys[Math.floor(cursor/3)][cursor%3];
        if (key !== undefined) {
            if (key === "OK") {
                if (stage === -1) { numSimulations = parseInt(inputBuffer) || 100; inputBuffer = ""; stage = 0; }
                else if (stage === 0) { homeXG = parseFloat(inputBuffer) || 0.0; inputBuffer = ""; stage = 1; }
                else if (stage === 1) { awayXG = parseFloat(inputBuffer) || 0.0; inputBuffer = ""; stage = 2; }
            } else if (key === "<") { inputBuffer = inputBuffer.slice(0, -1); }
            else { inputBuffer += key; }
        }
    }
    prevCross = currentCross;

    Draw.rect(0, 0, sw, sh, Color.new(18, 18, 24, 255));

    // Menu: Simulaciones
    if (stage === -1) {
        font.print(sw * 0.15, sh * 0.10, "MONTE CARLO MATCH SIMULATOR");
        font.print(sw * 0.15, sh * 0.22, "Configurar numero de simulaciones:");
        Draw.rect(sw * 0.15, sh * 0.30, sw * 0.70, sh * 0.08, Color.new(30, 30, 38, 255));
        font.print(sw * 0.18, sh * 0.32, "Valor: " + inputBuffer);
        drawKeyboard(sw, sh);
    }

    // Menu: xG Local
    else if (stage === 0) {
        font.print(sw * 0.15, sh * 0.10, "CONFIGURACION: EQUIPO LOCAL");
        font.print(sw * 0.15, sh * 0.22, "Introduce los goles esperados (xG):");
        Draw.rect(sw * 0.15, sh * 0.30, sw * 0.70, sh * 0.08, Color.new(30, 30, 38, 255));
        font.print(sw * 0.18, sh * 0.32, "xG Local: " + inputBuffer);
        drawKeyboard(sw, sh);
    }

    // Menu: xG Rival
    else if (stage === 1) {
        font.print(sw * 0.15, sh * 0.10, "CONFIGURACION: EQUIPO RIVAL");
        font.print(sw * 0.15, sh * 0.22, "Introduce los goles esperados (xG):");
        Draw.rect(sw * 0.15, sh * 0.30, sw * 0.70, sh * 0.08, Color.new(30, 30, 38, 255));
        font.print(sw * 0.18, sh * 0.32, "xG Rival: " + inputBuffer);
        drawKeyboard(sw, sh);
    }

    // Calculos
    else if (stage === 2 && running) {
        scoreMat = Array.from({ length: 5 }, () => new Array(5).fill(0));
        countHomeWins = 0; countAwayWins = 0; countDraws = 0;

        for (let i=0; i<numSimulations; i++) {
            let homeGoals = poisson(homeXG);
            let awayGoals = poisson(awayXG);
            if (homeGoals > awayGoals) countHomeWins++;
            else if (homeGoals < awayGoals) countAwayWins++;
            else countDraws++;
            
            if (homeGoals < 5 && awayGoals < 5) {
                scoreMat[homeGoals][awayGoals]++;
            }

            if (i % 20 === 0) {
                let barMaxW = sw * 0.80;
                let progress = (i / numSimulations) * barMaxW;
                Draw.rect((sw - barMaxW)/2, sh * 0.45, barMaxW, sh * 0.05, Color.new(40, 40, 50, 255));
                Draw.rect((sw - barMaxW)/2, sh * 0.45, progress, sh * 0.05, Color.new(0, 200, 80, 255));
                font.print((sw - barMaxW)/2, (sh * 0.45) + (sh * 0.07), "Simulando: " + i + " / " + numSimulations);
            }
        }
        running = false;
    }

    // Interfaz de resultados
    if (stage === 2 && !running) {
        let homeWinProb = round2(countHomeWins/numSimulations*100);
        let awayWinProb = round2(countAwayWins/numSimulations*100);
        let drawProb    = round2(countDraws/numSimulations*100);

        let col1 = sw * 0.04;
        let col2 = sw * 0.50;
        let panelW = sw * 0.46;
        let panelH = sh * 0.55;

        font.print(col1, sh * 0.05, "RESULTADOS DE LA SIMULACION");

        Draw.rect(col1, sh * 0.12, panelW, panelH, Color.new(28, 28, 36, 255));
        font.print(col1 + 12, sh * 0.16, homeTeam + " (Win %): " + homeWinProb, Color.new(50, 220, 100, 255));
        font.print(col1 + 12, sh * 0.22, awayTeam + " (Win %): " + awayWinProb, Color.new(240, 70, 70, 255));
        font.print(col1 + 12, sh * 0.28, "Empate (Draw %): " + drawProb, Color.new(70, 140, 240, 255));

        let homeXPts = round2((homeWinProb/100)*3.0 + (drawProb/100)*1.0);
        let awayXPts = round2((awayWinProb/100)*3.0 + (drawProb/100)*1.0);
        font.print(col1 + 12, sh * 0.38, homeTeam + " xPts: " + homeXPts);
        font.print(col1 + 12, sh * 0.44, awayTeam + " xPts: " + awayXPts);

        Draw.rect(col2, sh * 0.12, panelW, panelH, Color.new(28, 28, 36, 255));
        font.print(col2 + 12, sh * 0.16, "SCORE MATRIX (0-4)");
        
        let matrixSpacingY = sh * 0.045; 
        for (let h=0; h<5; h++) {
            let row = "";
            for (let a=0; a<5; a++) {
                let count = scoreMat[h][a];
                let prob = round2(count/numSimulations*100);
                row += prob.toString().padEnd(5, " ");
            }
            font.print(col2 + 12, (sh * 0.22) + (h * matrixSpacingY), h + ": " + row);
        }

        let btnY = sh * 0.82;
        font.print(col1, btnY, "circle: reiniciar");

        if (pad.pressed(Pads.CIRCLE)) {
            stage = -1;
            running = true;
            inputBuffer = "";
            countHomeWins = 0;
            countAwayWins = 0;
            countDraws = 0;
            scoreMat = [];
        }
    }
});
