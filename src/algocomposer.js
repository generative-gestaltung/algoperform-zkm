var NOTE_ON = 144;
var NOTE_OFF = 128;
var CC = 176;
var OUT;

var BASENOTE = 40;
var CHORDS = [
	[0,7,12,24],
	[3,15,3,27],
	[0,5,12,17,5],
	[5,5,17,19],
	[0,7,12,24,48],
	[7,17,21,33],
	[2,14,2,17,5],
	[5,5,29,35]
];

var CHORDS2 = [
	[12,16,17,24],
    [12+5,16+5,17+5,24+5],
    [12+12,16+12,17+12,24+12],
    [12+17,16+17,17+17,24+17]];


var frameCnt;


var PARAMS = {
	"cutoff"      : [0x03, 0x0c],
	"filt_env"    : [0x03, 0x0e],
	"filt_dec"    : [0x05, 0x07],
	"filt_att"    : [0x05, 0x06],
	"oct0"        : [0x00, 0x00],
	"oct1"        : [0x00, 0x0b],
	"osc1_mod1"   : [0x00, 0x07],
	"osc2_mod1"   : [0x01, 0x02],
	"w1_env"      : [0x01, 0x0a],
	"w2_env"      : [0x02, 0x06],
	"w1_pos"      : [0x01, 0x08],
	"w2_pos"      : [0x02, 0x04],
	"w1_v"        : [0x03, 0x00],
	"w2_v"        : [0x03, 0x01],
	"w1_mod1"     : [0x01, 0x0f],
	"w1_mod2"     : [0x02, 0x01],
	"amp_r"       : [0x04, 0x0b],
	"amp_a"       : [0x04, 0x08],
	"wt"          : [0x01, 0x07],
	"noise_v"     : [0x03, 0x02],

}

var midiSend = function(type, ch, val0, val1) {
	OUT.sendMessage ([type+ch, val0, val1]);
};

var getRandomNote = function(chord, slot) {
	var n = CHORDS[chord].length;
	var r = Math.floor(Math.random()*(n-0.0001));

	if (slot==0)
		return 62+CHORDS[chord][r];
	else 
		return 62+CHORDS2[chord][r];
}

var sysex = function (param, v, inst) {
	var dev = 0x00;
	var pp1 = PARAMS[param][0];
	var pp2 = PARAMS[param][1];
	var msg = [0xf0, 0x3e, 0x00, dev, 0x60, inst, pp1, pp2, Math.round(v), 0x7f, 0xf7];
	OUT.sendMessage(msg);
}


var cnt0 = 0;

var MAX_NOTES = 2;
var NOTES = [];
var SCALER = 8;
var PROB_PLAY = 0.8;

var play0 = function (ch, frameCnt, vel) {

	// decrease note duration
	for (var i=0; i<NOTES.length; i++) {
		NOTES[i].duration -= 1;
		if (NOTES[i].duration<=0) {
			// stop
			OUT.sendMessage([NOTE_OFF+ch, NOTES[i].pitch+20, 0]);
		}
	}


	var C = Math.round(cnt0/60) % 8;
	var slot = 0;
	if (frameCnt>16000) {
		C = Math.round(cnt0/40) % 4;
		slot = 1;
	}


	cnt0 += 1;
	for (var i=0; i<MAX_NOTES; i++) {
		// start new with prob
		if (Math.random() < PROB_PLAY && NOTES[i].duration<=0) {

			var pitch = getRandomNote(C,slot);
			NOTES[i].duration = Math.pow(2, Math.round(Math.random()*2))*20;
			NOTES[i].pitch = pitch;
			OUT.sendMessage([NOTE_ON+ch, pitch, vel]);
			//console.log(NOTES);
		}
	}
}

var noteOff = function (ch, pitch) {
	OUT.sendMessage([NOTE_OFF+ch, pitch, 0]);
}

var cnt = 0;
var clockDivide = function (ch, pitch, vel, PRE) {
	
	var C = Math.pow(2, Math.round(PRE));
	if ((cnt%C)==0) { //(Math.pow(2,Math.round(PRE))==0)) {
		OUT.sendMessage([NOTE_OFF+ch, pitch, vel]);		
		OUT.sendMessage([NOTE_ON+ch, pitch, vel]);		
	}
}


var pulse = function (ch, pitch, time, vel) {
	
	if ((frameCnt%time)==0) {	
		OUT.sendMessage([NOTE_ON+ch, pitch, vel]);		
	}
	if ((frameCnt%time)==10) {
		OUT.sendMessage([NOTE_OFF+ch, pitch, vel]);	
	}
}

var allOff = function () {
	for (var i=0; i<127; i++) {
		OUT.sendMessage([NOTE_OFF+i, 0, 0]);
	}
}
var cnst = function (ch, pitch, vel, interval, off=0) {
	
	if ((cnt%interval)==Math.round(interval/4)) {
		OUT.sendMessage([NOTE_OFF+ch, pitch, vel]);		
	}
	if (off==0 && (cnt%interval)==0)
		OUT.sendMessage([NOTE_ON+ch, pitch, vel]);	
}

var I0 = 40;
var rythm0 = function (ch, pitch, vel, interval0, interval1, off=false) {
	
	I0 = interval0;
	if ((cnt%I0)==Math.round(I0/4)) {
		OUT.sendMessage([NOTE_OFF+ch, pitch, vel]);		
	}
	if (!off && (cnt%I0)==0) 
		OUT.sendMessage([NOTE_ON+ch, pitch, vel]);	
}

var NEXT = 30;
var I = 60;
var playedNotes = [];

module.exports = {

	init : function (midiOut) {
		OUT = midiOut;	
		for (var i=0; i<MAX_NOTES; i++) {
			NOTES[i] = {pitch:0, duration:0};
		}
	},

	play : function (f, ch) {


		frameCnt = f;
		//if ((frameCnt%SCALER) != 0) return;

		pre0 = Math.sin(frameCnt*0.01)+1;
		oct = Math.round(Math.random())*12;
		vel = Math.round(Math.sin(frameCnt*0.02)*40+50);
		//clockDivide (ch, 84+oct, vel, pre0);
		//pre1 = (frameCnt%1000)/333+1;
		//clockDivide (3, 64, 40, pre1);



		var tm = 12;
		var P1 = 0;	
		if (true) {



			var F0 = 0;
			var DUR = 1500;
			if (frameCnt>F0 && frameCnt<F0+DUR) {

				var frc = frameCnt-F0;
				var vel = frc / 20;
				if (vel>100) vel = 100;
				if (frameCnt%100==0) {
					OUT.sendMessage([CC+5, 3, tm]);	
					OUT.sendMessage([CC+5, 2, vel]);	
					if (Math.random()<0.5)
						tm -= 1;

					console.log("on");
					OUT.sendMessage([NOTE_ON+5, 60, vel]);	
				}

				if (frameCnt%100==50) {

					console.log("off");
					OUT.sendMessage([NOTE_OFF+5, 60, vel]);
				}
			}

			
			if (frameCnt>6800 && frameCnt<9000) {
				if (frameCnt%400==0) {
					OUT.sendMessage([NOTE_OFF+6, 64, 4]);	
					OUT.sendMessage([NOTE_ON+6, 64, 4]);	
				}

				if (frameCnt%400==200) {
					OUT.sendMessage([NOTE_OFF+6, 60, 10]);	
					//OUT.sendMessage([NOTE_ON+5, 50, 50]);	
						
				}

				if (frameCnt%10==0) {

					P = (frameCnt/10)%100;	
					console.log(P);
					OUT.sendMessage([CC+6, 3, 2]);
					OUT.sendMessage([CC+6, 4, P]);
				}
			}

			if (frameCnt==10150) {
				console.log("BEAT");	
				OUT.sendMessage([CC+5, 3, 10]);
				OUT.sendMessage([NOTE_ON+5, 60, 80]);	
			}

			if (frameCnt==10350) {
				OUT.sendMessage([NOTE_OFF+5, 60, 120]);	
			}

			if (frameCnt>=12000) {
				var frm = frameCnt-12000;

				if (frm%300==0) {
					console.log("on");	
					OUT.sendMessage([CC+5, 3, Math.round(Math.random()*4+1)]);
					OUT.sendMessage([NOTE_ON+5, 60, 80]);	
				}
	
				if (frm%1500==1000) {
					OUT.sendMessage([NOTE_OFF+5, 60, 100]);	
				}

/*
				if (frameCnt%50==0) {
					OUT.sendMessage([CC+6, 3, Math.round(Math.random()*5+2)]);	
				}
*/
				if ((frameCnt-12000)%800==0) {

					console.log("x");	
					//OUT.sendMessage([NOTE_OFF+6, 60, 100]);	
					//OUT.sendMessage([NOTE_ON+6, 60, 100]);	
				}

				if ((frameCnt-12000)%800==700) {
					//OUT.sendMessage([NOTE_OFF+6, 60, 10]);	
					//OUT.sendMessage([NOTE_ON+5, 50, 50]);	
				}

				if (frameCnt>16000) {
					if (frameCnt%10) {
						OUT.sendMessage([CC+4, 5, P0]);
						P0 += 1;
					}
				}
			}
		}
		if (frameCnt<10) {
			sysex("cutoff", 10, 1);
			sysex ("noise_v", 127, 2);	
			sysex ("w1_v", 0, 2);	
			sysex ("w2_v", 0, 2);	
		}

		if (frameCnt%40==0) {
			sysex ("w1_pos", Math.sin(frameCnt*0.002)*20+20, 1);
		}
		if (frameCnt%100==0) {
			sysex ("oct0", Math.random()*32+32, 1);
			
			sysex ("osc1_mod1", 120, 2);
			sysex ("osc2_mod1", 120, 2);
			sysex ("oct1", 120, 2);
			sysex ("amp_r", 80, 0);
			//sysex ("cutoff", 80, 1);


			var cu = frameCnt / 30 + 20;
			 if (cu>70)
			cu = 70 + Math.sin(frameCnt*0.02)*10;
			console.log(frameCnt);

			if (frameCnt>8000 && frameCnt<9000)
				cu = 30;

			if (frameCnt>10000)
				cu += Math.sin(frameCnt*0.005)*20-20;
			sysex ("cutoff", cu, 0);	
			sysex ("amp_a", 20, 3);	
			sysex ("amp_r", 10, 3);
			sysex ("osc1_mod1", 64, 3);
			sysex ("osc2_mod1", 64, 3);	


			sysex ("cutoff", 100, 2);
		}

		if (frameCnt%1000 < 600) {
			PROB_PLAY = 0.2;
		}

		if (frameCnt>5000) {
			if (frameCnt%100==0) {
				var cu1 = (frameCnt-5000)/100;
				if (cu1>80);
					cu1 = 80+Math.sin(frameCnt*0.003)*20;
				sysex ("cutoff", cu1, 1);
			}
		}

		if (frameCnt==8000) {
			sysex ("noise_v", 127, 2);	
			sysex ("w1_v", 40, 2);	
			sysex ("w2_v", 0, 2);	
		}


		if (frameCnt==10000) {
			sysex ("noise_v", 127, 2);	
			sysex ("w1_v", 40, 2);	
			sysex ("w2_v", 40, 2);	
		}

		if (frameCnt%1000>800) {
			PROB_PLAY = 0.8;
			if (frameCnt%50==0) {
				console.log("oct");
				sysex("oct0", Math.random()*80, 3);
				sysex("amp_r", Math.random()*40, 3);
			}
		}

		cnst (0, 50, 20, 200, 0);
		
		if (frameCnt%4000 > 2500)
			rythm0 (1, 50, 20, 400, 50+12);
		if (frameCnt%8000 > 4000)
			rythm0 (1, 50, 20, 300, 50);

		var on = Math.sin(frameCnt*0.01+Math.sin(frameCnt*0.1)*0.003)*Math.sin(frameCnt*0.033)+Math.sin(frameCnt*0.1)*0.4+0.6;
		if (on<0) on = 0;
		else on = 1;
		cnst (2, 77, 20, 10, on);


		if (frameCnt>3000) {
			if (Math.sin(frameCnt*0.01)*0.5+0.5 < 0.5) 
				play0(3, frameCnt, 20);
		}

		cnt = cnt+1;
	},

	test : function () {
		console.log("test");
	}
};
