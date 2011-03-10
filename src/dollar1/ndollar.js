/**
 * This file is part of JSXGraph.
 * It is taken from the $n algorithm and is under the "New BSD License" (see below)
 * 
 * * The $N Multistroke Recognizer (JavaScript version)
 *
 *		Jacob O. Wobbrock
 * 		The Information School
 *		University of Washington
 *		Mary Gates Hall, Box 352840
 *		Seattle, WA 98195-2840
 *		wobbrock@u.washington.edu
 *
 *		Lisa Anthony
 *		Lockheed Martin
 *		Advanced Technology Laboratories
 * 		3 Executive Campus, Suite 600
 *		Cherry Hill, NJ 08002
 * 		lanthony@atl.lmco.com
 *
 * 
 * This software is distributed under the "New BSD License" agreement:
 * 
 * Copyright (c) 2007-2010, Jacob O. Wobbrock and Lisa Anthony
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *    * Redistributions of source code must retain the above copyright
 *      notice, this list of conditions and the following disclaimer.
 *    * Redistributions in binary form must reproduce the above copyright
 *      notice, this list of conditions and the following disclaimer in the
 *      documentation and/or other materials provided with the distribution.
 *    * Neither the name of the University of Washington or Lockheed Martin,
 *      nor the names of its contributors may be used to endorse or promote 
 *      products derived from this software without specific prior written
 *      permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
 * IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL Jacob O. Wobbrock OR Lisa Anthony 
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR 
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE 
 * GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) 
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
 * LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
 * OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
 * SUCH DAMAGE.
 *
 */

//
// Point class
//
function Point(x, y) // constructor
{
	this.X = x;
	this.Y = y;
}
//
// Rectangle class
//
function Rectangle(x, y, width, height) // constructor
{
	this.X = x;
	this.Y = y;
	this.Width = width;
	this.Height = height;
}
//
// Template class: a unistroke template
//
function Template(name, useLimitedRotationInvariance, points) // constructor
{
	this.Name = name;
	this.Points = Resample(points, NumPoints);
	var radians = IndicativeAngle(this.Points);
	this.Points = RotateBy(this.Points, -radians);
	this.Points = ScaleDimTo(this.Points, SquareSize, OneDThreshold);
	if (useLimitedRotationInvariance) this.Points = RotateBy(this.Points, +radians);
	this.Points = TranslateTo(this.Points, Origin);
	this.StartUnitVector = CalcStartUnitVector(this.Points, StartAngleIndex);
}
//
// Multistroke class: a container for unistroke templates
//
function Multistroke(name, useLimitedRotationInvariance, strokes) // constructor
{
	this.Name = name;
	this.NumStrokes = strokes.length; // number of individual strokes
	
	var order = new Array(); // array of integer indices
	for (var i = 0; i < strokes.length; i++)
		order[i] = i; // initialize
	
	var orders = new Array(); // array of integer arrays
	HeapPermute(strokes.length, order, /*out*/ orders);
	
	this.Templates = new Array();
	var unistrokes = MakeUnistrokes(strokes, orders); // returns array of point arrays
	for (var j = 0; j < unistrokes.length; j++)
		this.Templates[j] = new Template(name, useLimitedRotationInvariance, unistrokes[j]);
}
//
// Result class
//
function Result(name, score) // constructor
{
	this.Name = name;
	this.Score = score;
}
//
// NDollarRecognizer class constants
//
var NumMultistrokes = 16;
var NumPoints = 96;
var SquareSize = 250.0;
var OneDThreshold = 0.25; // customize to desired gesture set (usually 0.20-0.35)
var Origin = new Point(0,0);
var Diagonal = Math.sqrt(SquareSize * SquareSize + SquareSize * SquareSize);
var HalfDiagonal = 0.5 * Diagonal;
var AngleRange = Deg2Rad(45.0);
var AnglePrecision = Deg2Rad(2.0);
var Phi = 0.5 * (-1.0 + Math.sqrt(5.0)); // Golden Ratio
var StartAngleIndex = (NumPoints / 8); // eighth of gesture length
var AngleSimilarityThreshold = Deg2Rad(30.0);
//
// NDollarRecognizer class
//
function NDollarRecognizer(useLimitedRotationInvariance) // constructor
{
	//
	// one predefined multistroke for each gesture type
	//
	this.Multistrokes = new Array();
	
	this.Multistrokes[0] = new Multistroke("line", false, new Array(new Array(new Point(1,100),new Point(100,100))));

	/*points_opt_circle = new Array();
	for (i=0;i<30;i++){
		points_opt_circle[i] = new Point(Math.round(100+Math.cos(i*12/360*Math.PI)*50),Math.round(100+Math.sin(i*12/360*Math.PI)*50));
	}*/
	
	
	//this.Multistrokes[1] = new Multistroke("circle", false, new Array(points_opt_circle));
	this.Multistrokes[1] = new Multistroke("circle", false, new Array(new Array(new Point(97,175),new Point(97,152),new Point(97,151),new Point(97,149),new Point(97,147),new Point(97,146),new Point(97,144),new Point(97,143),new Point(97,141),new Point(97,140),new Point(97,139),new Point(97,138),new Point(97,137),new Point(98,135),new Point(98,132),new Point(99,131),new Point(100,129),new Point(101,127),new Point(103,123),new Point(105,120),new Point(107,118),new Point(108,116),new Point(109,115),new Point(110,114),new Point(110,113),new Point(112,111),new Point(113,111),new Point(115,108),new Point(117,106),new Point(119,104),new Point(121,103),new Point(121,102),new Point(123,101),new Point(125,99),new Point(129,96),new Point(133,94),new Point(138,92),new Point(141,91),new Point(143,90),new Point(144,89),new Point(146,89),new Point(149,88),new Point(154,87),new Point(159,84),new Point(163,84),new Point(166,84),new Point(167,84),new Point(168,84),new Point(171,84),new Point(173,83),new Point(176,83),new Point(179,83),new Point(181,83),new Point(184,83),new Point(186,83),new Point(188,83),new Point(191,83),new Point(193,83),new Point(197,83),new Point(203,83),new Point(204,83),new Point(205,83),new Point(206,83),new Point(207,83),new Point(208,83),new Point(211,83),new Point(214,83),new Point(217,83),new Point(219,84),new Point(220,84),new Point(221,84),new Point(223,86),new Point(225,87),new Point(228,89),new Point(229,90),new Point(231,93),new Point(233,94),new Point(234,95),new Point(236,96),new Point(237,98),new Point(239,99),new Point(241,101),new Point(243,104),new Point(245,105),new Point(246,108),new Point(248,110),new Point(250,113),new Point(253,118),new Point(256,122),new Point(257,125),new Point(257,127),new Point(258,130),new Point(260,133),new Point(261,135),new Point(262,138),new Point(264,140),new Point(264,141),new Point(265,143),new Point(265,145),new Point(266,148),new Point(267,152),new Point(267,159),new Point(268,165),new Point(269,167),new Point(269,168),new Point(269,169),new Point(269,171),new Point(269,172),new Point(269,177),new Point(269,179),new Point(269,180),new Point(269,183),new Point(269,186),new Point(269,188),new Point(269,192),new Point(269,195),new Point(269,197),new Point(269,199),new Point(269,200),new Point(269,202),new Point(269,205),new Point(269,210),new Point(269,215),new Point(269,216),new Point(269,219),new Point(269,220),new Point(268,224),new Point(267,225),new Point(266,226),new Point(265,228),new Point(263,230),new Point(262,230),new Point(261,231),new Point(260,233),new Point(256,235),new Point(254,236),new Point(252,236),new Point(248,238),new Point(243,240),new Point(240,240),new Point(233,244),new Point(226,246),new Point(226,247),new Point(223,247),new Point(221,247),new Point(219,247),new Point(209,247),new Point(207,248),new Point(206,248),new Point(201,248),new Point(196,250),new Point(189,250),new Point(175,250),new Point(173,250),new Point(171,250),new Point(169,250),new Point(164,250),new Point(156,250),new Point(153,250),new Point(152,250),new Point(150,250),new Point(148,250),new Point(145,250),new Point(142,250),new Point(141,250),new Point(140,250),new Point(137,248),new Point(136,247),new Point(134,245),new Point(133,245),new Point(130,242),new Point(129,240),new Point(128,240),new Point(127,239),new Point(126,238),new Point(124,236),new Point(123,234),new Point(123,233),new Point(122,232),new Point(121,230),new Point(120,227),new Point(120,225),new Point(119,223),new Point(118,221),new Point(118,219),new Point(117,216),new Point(116,214),new Point(115,212),new Point(114,209),new Point(112,207),new Point(112,206),new Point(112,201),new Point(111,199),new Point(111,197),new Point(110,193),new Point(103,168),new Point(103,166),new Point(103,164),new Point(103,163),new Point(102,163),new Point(102,161),new Point(101,160),new Point(101,159),new Point(101,158),new Point(101,157),new Point(100,157))));
	
	//this.Multistrokes[2] = new Multistroke("square", false, new Array(new Array (new Point(110,110),new Point(160,160),new Point(210,210),new Point(160,260),new Point(110,310),new Point(60,260),new Point(10,210),new Point(60,160))));
	this.Multistrokes[2] = new Multistroke("square", false, new Array(new Array (new Point(96,69),new Point(96,70),new Point(96,81),new Point(96,84),new Point(96,89),new Point(96,93),new Point(96,97),new Point(96,102),new Point(96,105),new Point(96,108),new Point(96,112),new Point(96,116),new Point(96,122),new Point(95,130),new Point(95,136),new Point(95,138),new Point(95,141),new Point(95,143),new Point(95,144),new Point(95,146),new Point(95,147),new Point(94,147),new Point(94,148),new Point(94,149),new Point(94,151),new Point(93,154),new Point(92,155),new Point(92,156),new Point(92,159),new Point(91,163),new Point(90,168),new Point(90,175),new Point(90,178),new Point(90,180),new Point(90,182),new Point(90,183),new Point(90,184),new Point(90,187),new Point(90,191),new Point(90,194),new Point(90,197),new Point(90,198),new Point(90,200),new Point(90,202),new Point(90,203),new Point(90,205),new Point(90,206),new Point(90,207),new Point(90,208),new Point(90,209),new Point(91,210),new Point(95,210),new Point(97,210),new Point(99,210),new Point(100,210),new Point(101,210),new Point(103,210),new Point(104,210),new Point(105,210),new Point(107,210),new Point(110,210),new Point(112,210),new Point(115,210),new Point(117,210),new Point(118,210),new Point(120,210),new Point(122,210),new Point(123,210),new Point(126,210),new Point(129,210),new Point(132,210),new Point(134,210),new Point(135,210),new Point(137,210),new Point(139,210),new Point(142,210),new Point(145,210),new Point(147,210),new Point(150,210),new Point(152,210),new Point(153,210),new Point(155,210),new Point(157,210),new Point(159,210),new Point(161,210),new Point(164,210),new Point(167,210),new Point(168,210),new Point(170,210),new Point(174,210),new Point(177,210),new Point(181,210),new Point(183,210),new Point(186,210),new Point(188,210),new Point(191,210),new Point(194,210),new Point(196,210),new Point(197,210),new Point(200,210),new Point(202,210),new Point(205,210),new Point(208,210),new Point(210,210),new Point(211,210),new Point(212,210),new Point(214,210),new Point(216,210),new Point(217,210),new Point(218,210),new Point(219,210),new Point(221,210),new Point(223,210),new Point(224,210),new Point(229,210),new Point(231,210),new Point(233,210),new Point(235,210),new Point(239,210),new Point(241,210),new Point(242,210),new Point(243,210),new Point(244,210),new Point(245,210),new Point(247,210),new Point(251,210),new Point(254,210),new Point(256,210),new Point(258,210),new Point(259,210),new Point(260,210),new Point(261,210),new Point(261,206),new Point(261,196),new Point(261,189),new Point(261,188),new Point(261,187),new Point(261,185),new Point(261,183),new Point(261,180),new Point(261,177),new Point(261,176),new Point(261,172),new Point(261,168),new Point(261,163),new Point(261,160),new Point(261,156),new Point(261,153),new Point(261,152),new Point(261,150),new Point(261,147),new Point(261,144),new Point(261,141),new Point(261,137),new Point(261,135),new Point(261,133),new Point(261,130),new Point(261,128),new Point(261,125),new Point(261,116),new Point(261,113),new Point(261,110),new Point(261,107),new Point(261,104),new Point(261,102),new Point(261,98),new Point(260,93),new Point(260,91),new Point(260,89),new Point(260,88),new Point(260,87),new Point(260,86),new Point(260,84),new Point(260,83),new Point(260,80),new Point(260,79),new Point(260,78),new Point(260,76),new Point(260,74),new Point(260,71),new Point(260,70),new Point(260,69),new Point(260,68),new Point(260,66),new Point(260,63),new Point(260,62),new Point(260,61),new Point(260,60),new Point(259,60),new Point(258,60),new Point(257,60),new Point(255,60),new Point(254,60),new Point(253,60),new Point(251,60),new Point(242,60),new Point(234,60),new Point(230,60),new Point(229,60),new Point(227,60),new Point(220,60),new Point(212,60),new Point(202,60),new Point(195,60),new Point(190,60),new Point(187,60),new Point(185,60),new Point(181,60),new Point(174,60),new Point(167,60),new Point(162,60),new Point(125,62),new Point(118,64),new Point(110,68),new Point(96,70),new Point(94,70),new Point(93,70),new Point(91,70),new Point(89,70),new Point(88,71),new Point(87,71),new Point(86,71),new Point(85,71))));
	
	this.Multistrokes[3] = new Multistroke("circle", false, new Array(new Array (new Point(26,226),new Point(26,225),new Point(34,215),new Point(41,207),new Point(49,197),new Point(55,192),new Point(71,177),new Point(89,162),new Point(98,152),new Point(114,140),new Point(120,135),new Point(126,129),new Point(132,126),new Point(137,121),new Point(144,115),new Point(150,111),new Point(157,107),new Point(166,102),new Point(176,97),new Point(182,95),new Point(191,89),new Point(202,84),new Point(215,81),new Point(225,77),new Point(232,74),new Point(239,72),new Point(246,71),new Point(253,70),new Point(263,69),new Point(270,69),new Point(279,69),new Point(293,69),new Point(306,69),new Point(317,69),new Point(331,69),new Point(344,69),new Point(354,69),new Point(368,69),new Point(374,70),new Point(381,73),new Point(384,73),new Point(386,74),new Point(388,75),new Point(389,75),new Point(390,75),new Point(390,77),new Point(390,78),new Point(390,79),new Point(391,80),new Point(393,80),new Point(397,81),new Point(410,87),new Point(417,90),new Point(424,92),new Point(429,94),new Point(436,97),new Point(439,100),new Point(442,100),new Point(444,102),new Point(447,104),new Point(447,105),new Point(448,106),new Point(449,107),new Point(449,108),new Point(450,110),new Point(451,114),new Point(452,115),new Point(453,117),new Point(453,118),new Point(453,119),new Point(454,120),new Point(455,120),new Point(455,121),new Point(455,122))));
	this.Multistrokes[4] = new Multistroke("triangle", false, new Array(new Array (new Point(66,236),new Point(66,235),new Point(84,214),new Point(87,210),new Point(94,201),new Point(106,183),new Point(114,175),new Point(119,168),new Point(126,162),new Point(130,156),new Point(135,148),new Point(138,145),new Point(144,137),new Point(150,129),new Point(155,123),new Point(161,117),new Point(166,112),new Point(172,103),new Point(176,94),new Point(183,88),new Point(189,80),new Point(195,74),new Point(203,69),new Point(207,62),new Point(214,55),new Point(217,48),new Point(218,46),new Point(218,45),new Point(219,45),new Point(220,45),new Point(221,45),new Point(225,47),new Point(227,50),new Point(231,57),new Point(235,63),new Point(239,68),new Point(247,80),new Point(250,87),new Point(253,92),new Point(257,99),new Point(262,111),new Point(267,120),new Point(272,128),new Point(282,141),new Point(287,148),new Point(293,160),new Point(296,165),new Point(302,174),new Point(306,181),new Point(311,191),new Point(314,197),new Point(320,209),new Point(323,215),new Point(328,223),new Point(329,227),new Point(335,236),new Point(339,241),new Point(347,255),new Point(352,262),new Point(356,271),new Point(358,274),new Point(359,275),new Point(359,276),new Point(360,276),new Point(358,276),new Point(355,276),new Point(348,276),new Point(332,273),new Point(321,272),new Point(317,272),new Point(313,272),new Point(311,271),new Point(309,270),new Point(301,269),new Point(286,264),new Point(279,263),new Point(265,262),new Point(246,261),new Point(236,261),new Point(222,261),new Point(214,260),new Point(207,259),new Point(197,258),new Point(193,258),new Point(185,256),new Point(175,255),new Point(169,255),new Point(159,254),new Point(155,254),new Point(148,254),new Point(145,254),new Point(139,253),new Point(128,253),new Point(116,253),new Point(113,253),new Point(109,253),new Point(108,253),new Point(107,253),new Point(105,253),new Point(100,252),new Point(97,251),new Point(93,251),new Point(90,249),new Point(85,248),new Point(83,247),new Point(79,245),new Point(77,245),new Point(76,245),new Point(74,245),new Point(60,242),new Point(60,241),new Point(60,240))));
/*	this.Multistrokes[0] = new Multistroke("T", useLimitedRotationInvariance, new Array(
		new Array(new Point(30,7),new Point(103,7)),
		new Array(new Point(66,7),new Point(66,87))
	));
	this.Multistrokes[1] = new Multistroke("N", useLimitedRotationInvariance, new Array(
		new Array(new Point(177,92),new Point(177,2)),
		new Array(new Point(182,1),new Point(246,95)),
		new Array(new Point(247,87),new Point(247,1))
	));
	this.Multistrokes[2] = new Multistroke("D", useLimitedRotationInvariance, new Array(
		new Array(new Point(345,9),new Point(345,87)),
		new Array(new Point(351,8),new Point(363,8),new Point(372,9),new Point(380,11),new Point(386,14),new Point(391,17),new Point(394,22),new Point(397,28),new Point(399,34),new Point(400,42),new Point(400,50),new Point(400,56),new Point(399,61),new Point(397,66),new Point(394,70),new Point(391,74),new Point(386,78),new Point(382,81),new Point(377,83),new Point(372,85),new Point(367,87),new Point(360,87),new Point(355,88),new Point(349,87))
	));
	this.Multistrokes[3] = new Multistroke("P", useLimitedRotationInvariance, new Array(
		new Array(new Point(507,8),new Point(507,87)),
		new Array(new Point(513,7),new Point(528,7),new Point(537,8),new Point(544,10),new Point(550,12),new Point(555,15),new Point(558,18),new Point(560,22),new Point(561,27),new Point(562,33),new Point(561,37),new Point(559,42),new Point(556,45),new Point(550,48),new Point(544,51),new Point(538,53),new Point(532,54),new Point(525,55),new Point(519,55),new Point(513,55),new Point(510,55))
	));
	this.Multistrokes[4] = new Multistroke("X", useLimitedRotationInvariance, new Array(
		new Array(new Point(30,146),new Point(106,222)),
		new Array(new Point(30,225),new Point(106,146))
	));
	this.Multistrokes[5] = new Multistroke("H", useLimitedRotationInvariance, new Array(
		new Array(new Point(188,137),new Point(188,225)),
		new Array(new Point(188,180),new Point(241,180)),
		new Array(new Point(241,137),new Point(241,225))
	));
	this.Multistrokes[6] = new Multistroke("I", useLimitedRotationInvariance, new Array(
		new Array(new Point(371,149),new Point(371,221)),
		new Array(new Point(341,149),new Point(401,149)),
		new Array(new Point(341,221),new Point(401,221))
	));
	this.Multistrokes[7] = new Multistroke("exclamation", useLimitedRotationInvariance, new Array(
		new Array(new Point(526,142),new Point(526,204)),
		new Array(new Point(526,221))
	));
	this.Multistrokes[8] = new Multistroke("line", useLimitedRotationInvariance, new Array(
		new Array(new Point(12,347),new Point(119,347))
	));
	this.Multistrokes[9] = new Multistroke("five-point star", useLimitedRotationInvariance, new Array(
		new Array(new Point(177,396),new Point(223,299),new Point(262,396),new Point(168,332),new Point(278,332),new Point(184,397))
	));
	this.Multistrokes[10] = new Multistroke("null", useLimitedRotationInvariance, new Array(
		new Array(new Point(382,310),new Point(377,308),new Point(373,307),new Point(366,307),new Point(360,310),new Point(356,313),new Point(353,316),new Point(349,321),new Point(347,326),new Point(344,331),new Point(342,337),new Point(341,343),new Point(341,350),new Point(341,358),new Point(342,362),new Point(344,366),new Point(347,370),new Point(351,374),new Point(356,379),new Point(361,382),new Point(368,385),new Point(374,387),new Point(381,387),new Point(390,387),new Point(397,385),new Point(404,382),new Point(408,378),new Point(412,373),new Point(416,367),new Point(418,361),new Point(419,353),new Point(418,346),new Point(417,341),new Point(416,336),new Point(413,331),new Point(410,326),new Point(404,320),new Point(400,317),new Point(393,313),new Point(392,312)),
		new Array(new Point(418,309),new Point(337,390))
	));
	this.Multistrokes[11] = new Multistroke("arrowhead", useLimitedRotationInvariance, new Array(
		new Array(new Point(506,349),new Point(574,349)),
		new Array(new Point(525,306),new Point(584,349),new Point(525,388))
	));
	this.Multistrokes[12] = new Multistroke("pitchfork", useLimitedRotationInvariance, new Array(
		new Array(new Point(38,470),new Point(36,476),new Point(36,482),new Point(37,489),new Point(39,496),new Point(42,500),new Point(46,503),new Point(50,507),new Point(56,509),new Point(63,509),new Point(70,508),new Point(75,506),new Point(79,503),new Point(82,499),new Point(85,493),new Point(87,487),new Point(88,480),new Point(88,474),new Point(87,468)),
		new Array(new Point(62,464),new Point(62,571))
	));
	this.Multistrokes[13] = new Multistroke("six-point star", useLimitedRotationInvariance, new Array(
		new Array(new Point(177,554),new Point(223,476),new Point(268,554),new Point(183,554)),
		new Array(new Point(177,490),new Point(223,568),new Point(268,490),new Point(183,490))
	));
	this.Multistrokes[14] = new Multistroke("asterisk", useLimitedRotationInvariance, new Array(
		new Array(new Point(325,499),new Point(417,557)),
		new Array(new Point(417,499),new Point(325,557)),
		new Array(new Point(371,486),new Point(371,571))
	));
	this.Multistrokes[15] = new Multistroke("half-note", useLimitedRotationInvariance, new Array(
		new Array(new Point(546,465),new Point(546,531)),
		new Array(new Point(540,530),new Point(536,529),new Point(533,528),new Point(529,529),new Point(524,530),new Point(520,532),new Point(515,535),new Point(511,539),new Point(508,545),new Point(506,548),new Point(506,554),new Point(509,558),new Point(512,561),new Point(517,564),new Point(521,564),new Point(527,563),new Point(531,560),new Point(535,557),new Point(538,553),new Point(542,548),new Point(544,544),new Point(546,540),new Point(546,536))
	));
*/
	//
	// The $N Gesture Recognizer API begins here -- 3 methods
	//
	this.Recognize = function(strokes, matchOnlyIfSameNumberOfStrokes, useLimitedRotationInvariance)
	{
		var points = CombineStrokes(strokes); // make one connected unistroke from the given strokes
		points = Resample(points, NumPoints);
		var radians = IndicativeAngle(points);
		points = RotateBy(points, -radians);
		points = ScaleDimTo(points, SquareSize, OneDThreshold);
		if (useLimitedRotationInvariance) points = RotateBy(points, +radians);
		points = TranslateTo(points, Origin);
		var startv = CalcStartUnitVector(points, StartAngleIndex);
		
		var b = +Infinity;
		var u = -1;
		for (var i = 0; i < this.Multistrokes.length; i++) // each multistroke
		{
			if (!matchOnlyIfSameNumberOfStrokes || strokes.length == this.Multistrokes[i].NumStrokes) // optional -- only attempt match when number of strokes is same
			{
				for (var j = 0; j < this.Multistrokes[i].Templates.length; j++) // each unistroke permutation
				{	
					if (AngleBetweenUnitVectors(startv, this.Multistrokes[i].Templates[j].StartUnitVector) <= AngleSimilarityThreshold)
					{	
						var d = DistanceAtBestAngle(points, this.Multistrokes[i].Templates[j], -AngleRange, +AngleRange, AnglePrecision); // iterative start
						if (d < b)
						{
							b = d; // distance
							u = i; // multistroke
						}
					}
				}
			}
		}
		if (u == -1) {
			return new Result("No match.", 0.0);
		} else {
			return new Result(this.Multistrokes[u].Name, 1.0 - (b / HalfDiagonal));
		}
	};
	//
	// add/delete new multistrokes
	//
	this.AddMultistroke = function(name, useLimitedRotationInvariance, strokes)
	{
		this.Multistrokes[this.Multistrokes.length] = new Multistroke(name, useLimitedRotationInvariance, strokes);
		var num = 0;
		for (var i = 0; i < this.Multistrokes.length; i++)
		{
			if (this.Multistrokes[i].Name == name)
				num++;
		}
		return num;
	}
	this.DeleteUserMultistrokes = function()
	{
		this.Multistrokes.length = NumMultistrokes; // clear any beyond the original set
		return NumMultistrokes;
	}
}
//
// Private helper functions from this point down
//
function HeapPermute(n, order, /*out*/ orders)
{
	if (n == 1)
	{
		orders[orders.length] = order.slice(); // append copy
	}
	else
	{
		for (var i = 0; i < n; i++)
		{
			HeapPermute(n - 1, order, orders);
			if (n % 2 == 1) // swap 0, n-1
			{
				var tmp = order[0];
				order[0] = order[n - 1];
				order[n - 1] = tmp;
			}
			else // swap i, n-1
			{
				var tmp = order[i];
				order[i] = order[n - 1];
				order[n - 1] = tmp;
			}
		}
	}
}
function MakeUnistrokes(strokes, orders)
{
	var unistrokes = new Array(); // array of point arrays
	for (var r = 0; r < orders.length; r++)
	{
		for (var b = 0; b < Math.pow(2, orders[r].length); b++) // use b's bits for directions
		{
			var unistroke = new Array(); // array of points
			for (var i = 0; i < orders[r].length; i++)
			{
				var pts;
				if (((b >> i) & 1) == 1) {  // is b's bit at index i on?
					pts = strokes[orders[r][i]].slice().reverse(); // copy and reverse
				} else {
					pts = strokes[orders[r][i]].slice(); // copy
				}
				for (var p = 0; p < pts.length; p++) {
					unistroke[unistroke.length] = pts[p]; // append points
				}
			}
			unistrokes[unistrokes.length] = unistroke; // add one unistroke to set
		}
	}
	return unistrokes;
}
function CombineStrokes(strokes)
{
	var points = new Array();
	for (var s = 0; s < strokes.length; s++) {
		for (var p = 0; p < strokes[s].length; p++) {
			points[points.length] = new Point(strokes[s][p].X, strokes[s][p].Y);
		}
	}
	return points;
}
function Resample(points, n)
{
	var I = PathLength(points) / (n - 1); // interval length
	var D = 0.0;
	var newpoints = new Array(points[0]);
	for (var i = 1; i < points.length; i++)
	{
		var d = Distance(points[i - 1], points[i]);
		if ((D + d) >= I)
		{
			var qx = points[i - 1].X + ((I - D) / d) * (points[i].X - points[i - 1].X);
			var qy = points[i - 1].Y + ((I - D) / d) * (points[i].Y - points[i - 1].Y);
			var q = new Point(qx, qy);
			newpoints[newpoints.length] = q; // append new point 'q'
			points.splice(i, 0, q); // insert 'q' at position i in points s.t. 'q' will be the next i
			D = 0.0;
		}
		else D += d;
	}
	// somtimes we fall a rounding-error short of adding the last point, so add it if so
	if (newpoints.length == n - 1)
	{
		newpoints[newpoints.length] = new Point(points[points.length - 1].X, points[points.length - 1].Y);
	}
	return newpoints;
}
function IndicativeAngle(points)
{
	var c = Centroid(points);
	return Math.atan2(c.Y - points[0].Y, c.X - points[0].X);
}
function RotateBy(points, radians) // rotates points around centroid
{
	var c = Centroid(points);
	var cos = Math.cos(radians);
	var sin = Math.sin(radians);
	
	var newpoints = new Array();
	for (var i = 0; i < points.length; i++)
	{
		var qx = (points[i].X - c.X) * cos - (points[i].Y - c.Y) * sin + c.X
		var qy = (points[i].X - c.X) * sin + (points[i].Y - c.Y) * cos + c.Y;
		newpoints[newpoints.length] = new Point(qx, qy);
	}
	return newpoints;
}
function ScaleDimTo(points, size, oneDratio) // scales bbox uniformly for 1D, non-uniformly for 2D
{
	var B = BoundingBox(points);
	var uniformly = Math.min(B.Width / B.Height, B.Height / B.Width) <= oneDratio; // 1D or 2D gesture test
	var newpoints = new Array();
	for (var i = 0; i < points.length; i++)
	{
		var qx = uniformly ? points[i].X * (size / Math.max(B.Width, B.Height)) : points[i].X * (size / B.Width);
		var qy = uniformly ? points[i].Y * (size / Math.max(B.Width, B.Height)) : points[i].Y * (size / B.Height);
		newpoints[newpoints.length] = new Point(qx, qy);
	}
	return newpoints;
}	
function TranslateTo(points, pt) // translates points' centroid
{
	var c = Centroid(points);
	var newpoints = new Array();
	for (var i = 0; i < points.length; i++)
	{
		var qx = points[i].X + pt.X - c.X;
		var qy = points[i].Y + pt.Y - c.Y;
		newpoints[newpoints.length] = new Point(qx, qy);
	}
	return newpoints;
}		
function DistanceAtBestAngle(points, T, a, b, threshold)
{
	var x1 = Phi * a + (1.0 - Phi) * b;
	var f1 = DistanceAtAngle(points, T, x1);
	var x2 = (1.0 - Phi) * a + Phi * b;
	var f2 = DistanceAtAngle(points, T, x2);
	while (Math.abs(b - a) > threshold)
	{
		if (f1 < f2)
		{
			b = x2;
			x2 = x1;
			f2 = f1;
			x1 = Phi * a + (1.0 - Phi) * b;
			f1 = DistanceAtAngle(points, T, x1);
		}
		else
		{
			a = x1;
			x1 = x2;
			f1 = f2;
			x2 = (1.0 - Phi) * a + Phi * b;
			f2 = DistanceAtAngle(points, T, x2);
		}
	}
	return Math.min(f1, f2);
}			
function DistanceAtAngle(points, T, radians)
{
	var newpoints = RotateBy(points, radians);
	return PathDistance(newpoints, T.Points);
}	
function Centroid(points)
{
	var x = 0.0, y = 0.0;
	for (var i = 0; i < points.length; i++)
	{
		x += points[i].X;
		y += points[i].Y;
	}
	x /= points.length;
	y /= points.length;
	return new Point(x, y);
}	
function BoundingBox(points)
{
	var minX = +Infinity, maxX = -Infinity, minY = +Infinity, maxY = -Infinity;
	for (var i = 0; i < points.length; i++)
	{
		if (points[i].X < minX)
			minX = points[i].X;
		if (points[i].X > maxX)
			maxX = points[i].X;
		if (points[i].Y < minY)
			minY = points[i].Y;
		if (points[i].Y > maxY)
			maxY = points[i].Y;
	}
	return new Rectangle(minX, minY, maxX - minX, maxY - minY);
}	
function PathDistance(pts1, pts2) // average distance between corresponding points in two paths
{
	var d = 0.0;
	for (var i = 0; i < pts1.length; i++) // assumes pts1.length == pts2.length
		d += Distance(pts1[i], pts2[i]);
	return d / pts1.length;
}
function PathLength(points) // length traversed by a point path
{
	var d = 0.0;
	for (var i = 1; i < points.length; i++)
		d += Distance(points[i - 1], points[i]);
	return d;
}		
function Distance(p1, p2) // distance between two points
{
	var dx = p2.X - p1.X;
	var dy = p2.Y - p1.Y;
	return Math.sqrt(dx * dx + dy * dy);
}
function CalcStartUnitVector(points, index) // start angle from points[0] to points[index] normalized as a unit vector
{
	var v = new Point(points[index].X - points[0].X, points[index].Y - points[0].Y);
	var len = Math.sqrt(v.X * v.X + v.Y * v.Y);
	return new Point(v.X / len, v.Y / len);
}
function AngleBetweenUnitVectors(v1, v2) // gives acute angle between unit vectors from (0,0) to v1, and (0,0) to v2
{
	var n = (v1.X * v2.X + v1.Y * v2.Y);
	if (n < -1.0 || n > +1.0)
		n = Round(n, 5); // fix JS rounding bug that can occur so that -1<=n<=+1
	return Math.acos(n); // arc cosine of the vector dot product
}
function Round(n,d) { d = Math.pow(10,d); return Math.round(n*d)/d; } // round 'n' to 'd' decimals
function Deg2Rad(d) { return (d * Math.PI / 180.0); }
function Rad2Deg(r) { return (r * 180.0 / Math.PI); }