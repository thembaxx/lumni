"use client";

import {
	AnimatePresence,
	motion,
	useSpring,
	useTransform,
} from "framer-motion";
import { Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface Element {
	atomicNumber: number;
	symbol: string;
	name: string;
	atomicMass: string;
	category: string;
	electronConfig: string;
	discoveryYear: string;
	namedAfter: string;
	row: number;
	col: number;
}

const elements: Element[] = [
	{
		atomicNumber: 1,
		symbol: "H",
		name: "Hydrogen",
		atomicMass: "1.008",
		category: "nonmetal",
		electronConfig: "1s¹",
		discoveryYear: "1766",
		namedAfter: "Greek 'hydro' + 'genes' (water-forming)",
		row: 1,
		col: 1,
	},
	{
		atomicNumber: 2,
		symbol: "He",
		name: "Helium",
		atomicMass: "4.003",
		category: "noble-gas",
		electronConfig: "1s²",
		discoveryYear: "1868",
		namedAfter: "Greek 'helios' (sun)",
		row: 1,
		col: 18,
	},
	{
		atomicNumber: 3,
		symbol: "Li",
		name: "Lithium",
		atomicMass: "6.941",
		category: "alkali-metal",
		electronConfig: "[He] 2s¹",
		discoveryYear: "1817",
		namedAfter: "Greek 'lithos' (stone)",
		row: 2,
		col: 1,
	},
	{
		atomicNumber: 4,
		symbol: "Be",
		name: "Beryllium",
		atomicMass: "9.012",
		category: "alkaline-earth",
		electronConfig: "[He] 2s²",
		discoveryYear: "1798",
		namedAfter: "Greek 'beryllos' (beryl)",
		row: 2,
		col: 2,
	},
	{
		atomicNumber: 5,
		symbol: "B",
		name: "Boron",
		atomicMass: "10.81",
		category: "metalloid",
		electronConfig: "[He] 2s² 2p¹",
		discoveryYear: "1808",
		namedAfter: "Arabic 'buraq' (borax)",
		row: 2,
		col: 13,
	},
	{
		atomicNumber: 6,
		symbol: "C",
		name: "Carbon",
		atomicMass: "12.01",
		category: "nonmetal",
		electronConfig: "[He] 2s² 2p²",
		discoveryYear: "Ancient",
		namedAfter: "Latin 'carbo' (charcoal)",
		row: 2,
		col: 14,
	},
	{
		atomicNumber: 7,
		symbol: "N",
		name: "Nitrogen",
		atomicMass: "14.01",
		category: "nonmetal",
		electronConfig: "[He] 2s² 2p³",
		discoveryYear: "1772",
		namedAfter: "Greek 'nitron' + 'genes' (niter-forming)",
		row: 2,
		col: 15,
	},
	{
		atomicNumber: 8,
		symbol: "O",
		name: "Oxygen",
		atomicMass: "16.00",
		category: "nonmetal",
		electronConfig: "[He] 2s² 2p⁴",
		discoveryYear: "1774",
		namedAfter: "Greek 'oxys' + 'genes' (acid-forming)",
		row: 2,
		col: 16,
	},
	{
		atomicNumber: 9,
		symbol: "F",
		name: "Fluorine",
		atomicMass: "19.00",
		category: "halogen",
		electronConfig: "[He] 2s² 2p⁵",
		discoveryYear: "1886",
		namedAfter: "Latin 'fluere' (to flow)",
		row: 2,
		col: 17,
	},
	{
		atomicNumber: 10,
		symbol: "Ne",
		name: "Neon",
		atomicMass: "20.18",
		category: "noble-gas",
		electronConfig: "[He] 2s² 2p⁶",
		discoveryYear: "1898",
		namedAfter: "Greek 'neos' (new)",
		row: 2,
		col: 18,
	},
	{
		atomicNumber: 11,
		symbol: "Na",
		name: "Sodium",
		atomicMass: "22.99",
		category: "alkali-metal",
		electronConfig: "[Ne] 3s¹",
		discoveryYear: "1807",
		namedAfter: "Latin 'natrium' (soda)",
		row: 3,
		col: 1,
	},
	{
		atomicNumber: 12,
		symbol: "Mg",
		name: "Magnesium",
		atomicMass: "24.31",
		category: "alkaline-earth",
		electronConfig: "[Ne] 3s²",
		discoveryYear: "1755",
		namedAfter: "Magnesia, Greece",
		row: 3,
		col: 2,
	},
	{
		atomicNumber: 13,
		symbol: "Al",
		name: "Aluminum",
		atomicMass: "26.98",
		category: "post-transition",
		electronConfig: "[Ne] 3s² 3p¹",
		discoveryYear: "1825",
		namedAfter: "Latin 'alumen' (alum)",
		row: 3,
		col: 13,
	},
	{
		atomicNumber: 14,
		symbol: "Si",
		name: "Silicon",
		atomicMass: "28.09",
		category: "metalloid",
		electronConfig: "[Ne] 3s² 3p²",
		discoveryYear: "1824",
		namedAfter: "Latin 'silex' (flint)",
		row: 3,
		col: 14,
	},
	{
		atomicNumber: 15,
		symbol: "P",
		name: "Phosphorus",
		atomicMass: "30.97",
		category: "nonmetal",
		electronConfig: "[Ne] 3s² 3p³",
		discoveryYear: "1669",
		namedAfter: "Greek 'phosphoros' (light-bearing)",
		row: 3,
		col: 15,
	},
	{
		atomicNumber: 16,
		symbol: "S",
		name: "Sulfur",
		atomicMass: "32.07",
		category: "nonmetal",
		electronConfig: "[Ne] 3s² 3p⁴",
		discoveryYear: "Ancient",
		namedAfter: "Latin 'sulphur'",
		row: 3,
		col: 16,
	},
	{
		atomicNumber: 17,
		symbol: "Cl",
		name: "Chlorine",
		atomicMass: "35.45",
		category: "halogen",
		electronConfig: "[Ne] 3s² 3p⁵",
		discoveryYear: "1774",
		namedAfter: "Greek 'chloros' (pale green)",
		row: 3,
		col: 17,
	},
	{
		atomicNumber: 18,
		symbol: "Ar",
		name: "Argon",
		atomicMass: "39.95",
		category: "noble-gas",
		electronConfig: "[Ne] 3s² 3p⁶",
		discoveryYear: "1894",
		namedAfter: "Greek 'argos' (inactive)",
		row: 3,
		col: 18,
	},
	{
		atomicNumber: 19,
		symbol: "K",
		name: "Potassium",
		atomicMass: "39.10",
		category: "alkali-metal",
		electronConfig: "[Ar] 4s¹",
		discoveryYear: "1807",
		namedAfter: "English 'potash'",
		row: 4,
		col: 1,
	},
	{
		atomicNumber: 20,
		symbol: "Ca",
		name: "Calcium",
		atomicMass: "40.08",
		category: "alkaline-earth",
		electronConfig: "[Ar] 4s²",
		discoveryYear: "1808",
		namedAfter: "Latin 'calx' (lime)",
		row: 4,
		col: 2,
	},
	{
		atomicNumber: 21,
		symbol: "Sc",
		name: "Scandium",
		atomicMass: "44.96",
		category: "transition-metal",
		electronConfig: "[Ar] 3d¹ 4s²",
		discoveryYear: "1879",
		namedAfter: "Latin 'Scandia' (Scandinavia)",
		row: 4,
		col: 3,
	},
	{
		atomicNumber: 22,
		symbol: "Ti",
		name: "Titanium",
		atomicMass: "47.87",
		category: "transition-metal",
		electronConfig: "[Ar] 3d² 4s²",
		discoveryYear: "1791",
		namedAfter: "Greek Titans",
		row: 4,
		col: 4,
	},
	{
		atomicNumber: 23,
		symbol: "V",
		name: "Vanadium",
		atomicMass: "50.94",
		category: "transition-metal",
		electronConfig: "[Ar] 3d³ 4s²",
		discoveryYear: "1801",
		namedAfter: "Vanadis (Norse goddess)",
		row: 4,
		col: 5,
	},
	{
		atomicNumber: 24,
		symbol: "Cr",
		name: "Chromium",
		atomicMass: "52.00",
		category: "transition-metal",
		electronConfig: "[Ar] 3d⁵ 4s¹",
		discoveryYear: "1797",
		namedAfter: "Greek 'chroma' (color)",
		row: 4,
		col: 6,
	},
	{
		atomicNumber: 25,
		symbol: "Mn",
		name: "Manganese",
		atomicMass: "54.94",
		category: "transition-metal",
		electronConfig: "[Ar] 3d⁵ 4s²",
		discoveryYear: "1774",
		namedAfter: "Latin 'magnes' (magnet)",
		row: 4,
		col: 7,
	},
	{
		atomicNumber: 26,
		symbol: "Fe",
		name: "Iron",
		atomicMass: "55.85",
		category: "transition-metal",
		electronConfig: "[Ar] 3d⁶ 4s²",
		discoveryYear: "Ancient",
		namedAfter: "Anglo-Saxon 'iren'",
		row: 4,
		col: 8,
	},
	{
		atomicNumber: 27,
		symbol: "Co",
		name: "Cobalt",
		atomicMass: "58.93",
		category: "transition-metal",
		electronConfig: "[Ar] 3d⁷ 4s²",
		discoveryYear: "1735",
		namedAfter: "German 'kobald' (goblin)",
		row: 4,
		col: 9,
	},
	{
		atomicNumber: 28,
		symbol: "Ni",
		name: "Nickel",
		atomicMass: "58.69",
		category: "transition-metal",
		electronConfig: "[Ar] 3d⁸ 4s²",
		discoveryYear: "1751",
		namedAfter: "German 'kupfernickel' (copper devil)",
		row: 4,
		col: 10,
	},
	{
		atomicNumber: 29,
		symbol: "Cu",
		name: "Copper",
		atomicMass: "63.55",
		category: "transition-metal",
		electronConfig: "[Ar] 3d¹⁰ 4s¹",
		discoveryYear: "Ancient",
		namedAfter: "Latin 'cuprum' (Cyprus)",
		row: 4,
		col: 11,
	},
	{
		atomicNumber: 30,
		symbol: "Zn",
		name: "Zinc",
		atomicMass: "65.38",
		category: "transition-metal",
		electronConfig: "[Ar] 3d¹⁰ 4s²",
		discoveryYear: "1746",
		namedAfter: "German 'zink'",
		row: 4,
		col: 12,
	},
	{
		atomicNumber: 31,
		symbol: "Ga",
		name: "Gallium",
		atomicMass: "69.72",
		category: "post-transition",
		electronConfig: "[Ar] 3d¹⁰ 4s² 4p¹",
		discoveryYear: "1875",
		namedAfter: "Latin 'Gallia' (France)",
		row: 4,
		col: 13,
	},
	{
		atomicNumber: 32,
		symbol: "Ge",
		name: "Germanium",
		atomicMass: "72.63",
		category: "metalloid",
		electronConfig: "[Ar] 3d¹⁰ 4s² 4p²",
		discoveryYear: "1886",
		namedAfter: "Latin 'Germania' (Germany)",
		row: 4,
		col: 14,
	},
	{
		atomicNumber: 33,
		symbol: "As",
		name: "Arsenic",
		atomicMass: "74.92",
		category: "metalloid",
		electronConfig: "[Ar] 3d¹⁰ 4s² 4p³",
		discoveryYear: "1250",
		namedAfter: "Greek 'arsenikon' (yellow)",
		row: 4,
		col: 15,
	},
	{
		atomicNumber: 34,
		symbol: "Se",
		name: "Selenium",
		atomicMass: "78.97",
		category: "nonmetal",
		electronConfig: "[Ar] 3d¹⁰ 4s² 4p⁴",
		discoveryYear: "1817",
		namedAfter: "Greek 'selene' (moon)",
		row: 4,
		col: 16,
	},
	{
		atomicNumber: 35,
		symbol: "Br",
		name: "Bromine",
		atomicMass: "79.90",
		category: "halogen",
		electronConfig: "[Ar] 3d¹⁰ 4s² 4p⁵",
		discoveryYear: "1826",
		namedAfter: "Greek 'bromos' (stench)",
		row: 4,
		col: 17,
	},
	{
		atomicNumber: 36,
		symbol: "Kr",
		name: "Krypton",
		atomicMass: "83.80",
		category: "noble-gas",
		electronConfig: "[Ar] 3d¹⁰ 4s² 4p⁶",
		discoveryYear: "1898",
		namedAfter: "Greek 'kryptos' (hidden)",
		row: 4,
		col: 18,
	},
	{
		atomicNumber: 37,
		symbol: "Rb",
		name: "Rubidium",
		atomicMass: "85.47",
		category: "alkali-metal",
		electronConfig: "[Kr] 5s¹",
		discoveryYear: "1861",
		namedAfter: "Latin 'rubidus' (deep red)",
		row: 5,
		col: 1,
	},
	{
		atomicNumber: 38,
		symbol: "Sr",
		name: "Strontium",
		atomicMass: "87.62",
		category: "alkaline-earth",
		electronConfig: "[Kr] 5s²",
		discoveryYear: "1790",
		namedAfter: "Strontian, Scotland",
		row: 5,
		col: 2,
	},
	{
		atomicNumber: 39,
		symbol: "Y",
		name: "Yttrium",
		atomicMass: "88.91",
		category: "transition-metal",
		electronConfig: "[Kr] 4d¹ 5s²",
		discoveryYear: "1794",
		namedAfter: "Ytterby, Sweden",
		row: 5,
		col: 3,
	},
	{
		atomicNumber: 40,
		symbol: "Zr",
		name: "Zirconium",
		atomicMass: "91.22",
		category: "transition-metal",
		electronConfig: "[Kr] 4d² 5s²",
		discoveryYear: "1789",
		namedAfter: "Arabic 'zargun' (gold-like)",
		row: 5,
		col: 4,
	},
	{
		atomicNumber: 41,
		symbol: "Nb",
		name: "Niobium",
		atomicMass: "92.91",
		category: "transition-metal",
		electronConfig: "[Kr] 4d⁴ 5s¹",
		discoveryYear: "1801",
		namedAfter: "Greek mythology (Niobe)",
		row: 5,
		col: 5,
	},
	{
		atomicNumber: 42,
		symbol: "Mo",
		name: "Molybdenum",
		atomicMass: "95.95",
		category: "transition-metal",
		electronConfig: "[Kr] 4d⁵ 5s¹",
		discoveryYear: "1781",
		namedAfter: "Greek 'molybdos' (lead)",
		row: 5,
		col: 6,
	},
	{
		atomicNumber: 43,
		symbol: "Tc",
		name: "Technetium",
		atomicMass: "98",
		category: "transition-metal",
		electronConfig: "[Kr] 4d⁵ 5s²",
		discoveryYear: "1937",
		namedAfter: "Greek 'technetos' (artificial)",
		row: 5,
		col: 7,
	},
	{
		atomicNumber: 44,
		symbol: "Ru",
		name: "Ruthenium",
		atomicMass: "101.1",
		category: "transition-metal",
		electronConfig: "[Kr] 4d⁷ 5s¹",
		discoveryYear: "1844",
		namedAfter: "Latin 'Ruthenia' (Russia)",
		row: 5,
		col: 8,
	},
	{
		atomicNumber: 45,
		symbol: "Rh",
		name: "Rhodium",
		atomicMass: "102.9",
		category: "transition-metal",
		electronConfig: "[Kr] 4d⁸ 5s¹",
		discoveryYear: "1803",
		namedAfter: "Greek 'rhodon' (rose)",
		row: 5,
		col: 9,
	},
	{
		atomicNumber: 46,
		symbol: "Pd",
		name: "Palladium",
		atomicMass: "106.4",
		category: "transition-metal",
		electronConfig: "[Kr] 4d¹⁰",
		discoveryYear: "1803",
		namedAfter: "Asteroid Pallas",
		row: 5,
		col: 10,
	},
	{
		atomicNumber: 47,
		symbol: "Ag",
		name: "Silver",
		atomicMass: "107.9",
		category: "transition-metal",
		electronConfig: "[Kr] 4d¹⁰ 5s¹",
		discoveryYear: "Ancient",
		namedAfter: "Anglo-Saxon 'seolfor'",
		row: 5,
		col: 11,
	},
	{
		atomicNumber: 48,
		symbol: "Cd",
		name: "Cadmium",
		atomicMass: "112.4",
		category: "transition-metal",
		electronConfig: "[Kr] 4d¹⁰ 5s²",
		discoveryYear: "1817",
		namedAfter: "Latin 'cadmia' (calamine)",
		row: 5,
		col: 12,
	},
	{
		atomicNumber: 49,
		symbol: "In",
		name: "Indium",
		atomicMass: "114.8",
		category: "post-transition",
		electronConfig: "[Kr] 4d¹⁰ 5s² 5p¹",
		discoveryYear: "1863",
		namedAfter: "Indigo spectral line",
		row: 5,
		col: 13,
	},
	{
		atomicNumber: 50,
		symbol: "Sn",
		name: "Tin",
		atomicMass: "118.7",
		category: "post-transition",
		electronConfig: "[Kr] 4d¹⁰ 5s² 5p²",
		discoveryYear: "Ancient",
		namedAfter: "Anglo-Saxon 'tin'",
		row: 5,
		col: 14,
	},
	{
		atomicNumber: 51,
		symbol: "Sb",
		name: "Antimony",
		atomicMass: "121.8",
		category: "metalloid",
		electronConfig: "[Kr] 4d¹⁰ 5s² 5p³",
		discoveryYear: "Ancient",
		namedAfter: "Greek 'anti' + 'monos'",
		row: 5,
		col: 15,
	},
	{
		atomicNumber: 52,
		symbol: "Te",
		name: "Tellurium",
		atomicMass: "127.6",
		category: "metalloid",
		electronConfig: "[Kr] 4d¹⁰ 5s² 5p⁴",
		discoveryYear: "1783",
		namedAfter: "Latin 'tellus' (earth)",
		row: 5,
		col: 16,
	},
	{
		atomicNumber: 53,
		symbol: "I",
		name: "Iodine",
		atomicMass: "126.9",
		category: "halogen",
		electronConfig: "[Kr] 4d¹⁰ 5s² 5p⁵",
		discoveryYear: "1811",
		namedAfter: "Greek 'iodes' (violet)",
		row: 5,
		col: 17,
	},
	{
		atomicNumber: 54,
		symbol: "Xe",
		name: "Xenon",
		atomicMass: "131.3",
		category: "noble-gas",
		electronConfig: "[Kr] 4d¹⁰ 5s² 5p⁶",
		discoveryYear: "1898",
		namedAfter: "Greek 'xenos' (stranger)",
		row: 5,
		col: 18,
	},
	{
		atomicNumber: 55,
		symbol: "Cs",
		name: "Cesium",
		atomicMass: "132.9",
		category: "alkali-metal",
		electronConfig: "[Xe] 6s¹",
		discoveryYear: "1860",
		namedAfter: "Latin 'caesius' (sky blue)",
		row: 6,
		col: 1,
	},
	{
		atomicNumber: 56,
		symbol: "Ba",
		name: "Barium",
		atomicMass: "137.3",
		category: "alkaline-earth",
		electronConfig: "[Xe] 6s²",
		discoveryYear: "1808",
		namedAfter: "Greek 'barys' (heavy)",
		row: 6,
		col: 2,
	},
	{
		atomicNumber: 57,
		symbol: "La",
		name: "Lanthanum",
		atomicMass: "138.9",
		category: "lanthanide",
		electronConfig: "[Xe] 5d¹ 6s²",
		discoveryYear: "1839",
		namedAfter: "Greek 'lanthanein' (to lie hidden)",
		row: 9,
		col: 3,
	},
	{
		atomicNumber: 58,
		symbol: "Ce",
		name: "Cerium",
		atomicMass: "140.1",
		category: "lanthanide",
		electronConfig: "[Xe] 4f¹ 5d¹ 6s²",
		discoveryYear: "1803",
		namedAfter: "Asteroid Ceres",
		row: 9,
		col: 4,
	},
	{
		atomicNumber: 59,
		symbol: "Pr",
		name: "Praseodymium",
		atomicMass: "140.9",
		category: "lanthanide",
		electronConfig: "[Xe] 4f³ 6s²",
		discoveryYear: "1885",
		namedAfter: "Greek 'prasios' + 'didymos' (green twin)",
		row: 9,
		col: 5,
	},
	{
		atomicNumber: 60,
		symbol: "Nd",
		name: "Neodymium",
		atomicMass: "144.2",
		category: "lanthanide",
		electronConfig: "[Xe] 4f⁴ 6s²",
		discoveryYear: "1885",
		namedAfter: "Greek 'neos' + 'didymos' (new twin)",
		row: 9,
		col: 6,
	},
	{
		atomicNumber: 61,
		symbol: "Pm",
		name: "Promethium",
		atomicMass: "145",
		category: "lanthanide",
		electronConfig: "[Xe] 4f⁵ 6s²",
		discoveryYear: "1945",
		namedAfter: "Greek mythology (Prometheus)",
		row: 9,
		col: 7,
	},
	{
		atomicNumber: 62,
		symbol: "Sm",
		name: "Samarium",
		atomicMass: "150.4",
		category: "lanthanide",
		electronConfig: "[Xe] 4f⁶ 6s²",
		discoveryYear: "1879",
		namedAfter: "Mineral Samarskite",
		row: 9,
		col: 8,
	},
	{
		atomicNumber: 63,
		symbol: "Eu",
		name: "Europium",
		atomicMass: "152.0",
		category: "lanthanide",
		electronConfig: "[Xe] 4f⁷ 6s²",
		discoveryYear: "1901",
		namedAfter: "Europe",
		row: 9,
		col: 9,
	},
	{
		atomicNumber: 64,
		symbol: "Gd",
		name: "Gadolinium",
		atomicMass: "157.3",
		category: "lanthanide",
		electronConfig: "[Xe] 4f⁷ 5d¹ 6s²",
		discoveryYear: "1880",
		namedAfter: "Johan Gadolin",
		row: 9,
		col: 10,
	},
	{
		atomicNumber: 65,
		symbol: "Tb",
		name: "Terbium",
		atomicMass: "158.9",
		category: "lanthanide",
		electronConfig: "[Xe] 4f⁹ 6s²",
		discoveryYear: "1843",
		namedAfter: "Ytterby, Sweden",
		row: 9,
		col: 11,
	},
	{
		atomicNumber: 66,
		symbol: "Dy",
		name: "Dysprosium",
		atomicMass: "162.5",
		category: "lanthanide",
		electronConfig: "[Xe] 4f¹⁰ 6s²",
		discoveryYear: "1886",
		namedAfter: "Greek 'dysprositos' (hard to get)",
		row: 9,
		col: 12,
	},
	{
		atomicNumber: 67,
		symbol: "Ho",
		name: "Holmium",
		atomicMass: "164.9",
		category: "lanthanide",
		electronConfig: "[Xe] 4f¹¹ 6s²",
		discoveryYear: "1878",
		namedAfter: "Latin 'Holmia' (Stockholm)",
		row: 9,
		col: 13,
	},
	{
		atomicNumber: 68,
		symbol: "Er",
		name: "Erbium",
		atomicMass: "167.3",
		category: "lanthanide",
		electronConfig: "[Xe] 4f¹² 6s²",
		discoveryYear: "1843",
		namedAfter: "Ytterby, Sweden",
		row: 9,
		col: 14,
	},
	{
		atomicNumber: 69,
		symbol: "Tm",
		name: "Thulium",
		atomicMass: "168.9",
		category: "lanthanide",
		electronConfig: "[Xe] 4f¹³ 6s²",
		discoveryYear: "1879",
		namedAfter: "Thule (Scandinavia)",
		row: 9,
		col: 15,
	},
	{
		atomicNumber: 70,
		symbol: "Yb",
		name: "Ytterbium",
		atomicMass: "173.0",
		category: "lanthanide",
		electronConfig: "[Xe] 4f¹⁴ 6s²",
		discoveryYear: "1878",
		namedAfter: "Ytterby, Sweden",
		row: 9,
		col: 16,
	},
	{
		atomicNumber: 71,
		symbol: "Lu",
		name: "Lutetium",
		atomicMass: "175.0",
		category: "lanthanide",
		electronConfig: "[Xe] 4f¹⁴ 5d¹ 6s²",
		discoveryYear: "1907",
		namedAfter: "Latin 'Lutetia' (Paris)",
		row: 9,
		col: 17,
	},
	{
		atomicNumber: 72,
		symbol: "Hf",
		name: "Hafnium",
		atomicMass: "178.5",
		category: "transition-metal",
		electronConfig: "[Xe] 4f¹⁴ 5d² 6s²",
		discoveryYear: "1923",
		namedAfter: "Latin 'Hafnia' (Copenhagen)",
		row: 6,
		col: 4,
	},
	{
		atomicNumber: 73,
		symbol: "Ta",
		name: "Tantalum",
		atomicMass: "180.9",
		category: "transition-metal",
		electronConfig: "[Xe] 4f¹⁴ 5d³ 6s²",
		discoveryYear: "1802",
		namedAfter: "Greek mythology (Tantalus)",
		row: 6,
		col: 5,
	},
	{
		atomicNumber: 74,
		symbol: "W",
		name: "Tungsten",
		atomicMass: "183.8",
		category: "transition-metal",
		electronConfig: "[Xe] 4f¹⁴ 5d⁴ 6s²",
		discoveryYear: "1783",
		namedAfter: "Swedish 'tung sten' (heavy stone)",
		row: 6,
		col: 6,
	},
	{
		atomicNumber: 75,
		symbol: "Re",
		name: "Rhenium",
		atomicMass: "186.2",
		category: "transition-metal",
		electronConfig: "[Xe] 4f¹⁴ 5d⁵ 6s²",
		discoveryYear: "1925",
		namedAfter: "Latin 'Rhenus' (Rhine)",
		row: 6,
		col: 7,
	},
	{
		atomicNumber: 76,
		symbol: "Os",
		name: "Osmium",
		atomicMass: "190.2",
		category: "transition-metal",
		electronConfig: "[Xe] 4f¹⁴ 5d⁶ 6s²",
		discoveryYear: "1803",
		namedAfter: "Greek 'osme' (smell)",
		row: 6,
		col: 8,
	},
	{
		atomicNumber: 77,
		symbol: "Ir",
		name: "Iridium",
		atomicMass: "192.2",
		category: "transition-metal",
		electronConfig: "[Xe] 4f¹⁴ 5d⁷ 6s²",
		discoveryYear: "1803",
		namedAfter: "Greek 'iris' (rainbow)",
		row: 6,
		col: 9,
	},
	{
		atomicNumber: 78,
		symbol: "Pt",
		name: "Platinum",
		atomicMass: "195.1",
		category: "transition-metal",
		electronConfig: "[Xe] 4f¹⁴ 5d⁹ 6s¹",
		discoveryYear: "1735",
		namedAfter: "Spanish 'platina' (little silver)",
		row: 6,
		col: 10,
	},
	{
		atomicNumber: 79,
		symbol: "Au",
		name: "Gold",
		atomicMass: "197.0",
		category: "transition-metal",
		electronConfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s¹",
		discoveryYear: "Ancient",
		namedAfter: "Anglo-Saxon 'geolo'",
		row: 6,
		col: 11,
	},
	{
		atomicNumber: 80,
		symbol: "Hg",
		name: "Mercury",
		atomicMass: "200.6",
		category: "transition-metal",
		electronConfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s²",
		discoveryYear: "Ancient",
		namedAfter: "Planet Mercury",
		row: 6,
		col: 12,
	},
	{
		atomicNumber: 81,
		symbol: "Tl",
		name: "Thallium",
		atomicMass: "204.4",
		category: "post-transition",
		electronConfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p¹",
		discoveryYear: "1861",
		namedAfter: "Greek 'thallos' (green twig)",
		row: 6,
		col: 13,
	},
	{
		atomicNumber: 82,
		symbol: "Pb",
		name: "Lead",
		atomicMass: "207.2",
		category: "post-transition",
		electronConfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²",
		discoveryYear: "Ancient",
		namedAfter: "Anglo-Saxon 'lead'",
		row: 6,
		col: 14,
	},
	{
		atomicNumber: 83,
		symbol: "Bi",
		name: "Bismuth",
		atomicMass: "209.0",
		category: "post-transition",
		electronConfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p³",
		discoveryYear: "1753",
		namedAfter: "German 'Wismuth'",
		row: 6,
		col: 15,
	},
	{
		atomicNumber: 84,
		symbol: "Po",
		name: "Polonium",
		atomicMass: "209",
		category: "metalloid",
		electronConfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁴",
		discoveryYear: "1898",
		namedAfter: "Poland",
		row: 6,
		col: 16,
	},
	{
		atomicNumber: 85,
		symbol: "At",
		name: "Astatine",
		atomicMass: "210",
		category: "halogen",
		electronConfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁵",
		discoveryYear: "1940",
		namedAfter: "Greek 'astatos' (unstable)",
		row: 6,
		col: 17,
	},
	{
		atomicNumber: 86,
		symbol: "Rn",
		name: "Radon",
		atomicMass: "222",
		category: "noble-gas",
		electronConfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁶",
		discoveryYear: "1900",
		namedAfter: "From Radium",
		row: 6,
		col: 18,
	},
	{
		atomicNumber: 87,
		symbol: "Fr",
		name: "Francium",
		atomicMass: "223",
		category: "alkali-metal",
		electronConfig: "[Rn] 7s¹",
		discoveryYear: "1939",
		namedAfter: "France",
		row: 7,
		col: 1,
	},
	{
		atomicNumber: 88,
		symbol: "Ra",
		name: "Radium",
		atomicMass: "226",
		category: "alkaline-earth",
		electronConfig: "[Rn] 7s²",
		discoveryYear: "1898",
		namedAfter: "Latin 'radius' (ray)",
		row: 7,
		col: 2,
	},
	{
		atomicNumber: 89,
		symbol: "Ac",
		name: "Actinium",
		atomicMass: "227",
		category: "actinide",
		electronConfig: "[Rn] 6d¹ 7s²",
		discoveryYear: "1899",
		namedAfter: "Greek 'aktis' (ray)",
		row: 10,
		col: 3,
	},
	{
		atomicNumber: 90,
		symbol: "Th",
		name: "Thorium",
		atomicMass: "232.0",
		category: "actinide",
		electronConfig: "[Rn] 6d² 7s²",
		discoveryYear: "1829",
		namedAfter: "Thor (Norse god)",
		row: 10,
		col: 4,
	},
	{
		atomicNumber: 91,
		symbol: "Pa",
		name: "Protactinium",
		atomicMass: "231.0",
		category: "actinide",
		electronConfig: "[Rn] 5f² 6d¹ 7s²",
		discoveryYear: "1913",
		namedAfter: "Greek 'protos' + 'actinium'",
		row: 10,
		col: 5,
	},
	{
		atomicNumber: 92,
		symbol: "U",
		name: "Uranium",
		atomicMass: "238.0",
		category: "actinide",
		electronConfig: "[Rn] 5f³ 6d¹ 7s²",
		discoveryYear: "1789",
		namedAfter: "Planet Uranus",
		row: 10,
		col: 6,
	},
	{
		atomicNumber: 93,
		symbol: "Np",
		name: "Neptunium",
		atomicMass: "237",
		category: "actinide",
		electronConfig: "[Rn] 5f⁴ 6d¹ 7s²",
		discoveryYear: "1940",
		namedAfter: "Planet Neptune",
		row: 10,
		col: 7,
	},
	{
		atomicNumber: 94,
		symbol: "Pu",
		name: "Plutonium",
		atomicMass: "244",
		category: "actinide",
		electronConfig: "[Rn] 5f⁶ 7s²",
		discoveryYear: "1940",
		namedAfter: "Planet Pluto",
		row: 10,
		col: 8,
	},
	{
		atomicNumber: 95,
		symbol: "Am",
		name: "Americium",
		atomicMass: "243",
		category: "actinide",
		electronConfig: "[Rn] 5f⁷ 7s²",
		discoveryYear: "1944",
		namedAfter: "Americas",
		row: 10,
		col: 9,
	},
	{
		atomicNumber: 96,
		symbol: "Cm",
		name: "Curium",
		atomicMass: "247",
		category: "actinide",
		electronConfig: "[Rn] 5f⁷ 6d¹ 7s²",
		discoveryYear: "1944",
		namedAfter: "Marie & Pierre Curie",
		row: 10,
		col: 10,
	},
	{
		atomicNumber: 97,
		symbol: "Bk",
		name: "Berkelium",
		atomicMass: "247",
		category: "actinide",
		electronConfig: "[Rn] 5f⁹ 7s²",
		discoveryYear: "1949",
		namedAfter: "Berkeley, California",
		row: 10,
		col: 11,
	},
	{
		atomicNumber: 98,
		symbol: "Cf",
		name: "Californium",
		atomicMass: "251",
		category: "actinide",
		electronConfig: "[Rn] 5f¹⁰ 7s²",
		discoveryYear: "1950",
		namedAfter: "California",
		row: 10,
		col: 12,
	},
	{
		atomicNumber: 99,
		symbol: "Es",
		name: "Einsteinium",
		atomicMass: "252",
		category: "actinide",
		electronConfig: "[Rn] 5f¹¹ 7s²",
		discoveryYear: "1952",
		namedAfter: "Albert Einstein",
		row: 10,
		col: 13,
	},
	{
		atomicNumber: 100,
		symbol: "Fm",
		name: "Fermium",
		atomicMass: "257",
		category: "actinide",
		electronConfig: "[Rn] 5f¹² 7s²",
		discoveryYear: "1952",
		namedAfter: "Enrico Fermi",
		row: 10,
		col: 14,
	},
	{
		atomicNumber: 101,
		symbol: "Md",
		name: "Mendelevium",
		atomicMass: "258",
		category: "actinide",
		electronConfig: "[Rn] 5f¹³ 7s²",
		discoveryYear: "1955",
		namedAfter: "Dmitri Mendeleev",
		row: 10,
		col: 15,
	},
	{
		atomicNumber: 102,
		symbol: "No",
		name: "Nobelium",
		atomicMass: "259",
		category: "actinide",
		electronConfig: "[Rn] 5f¹⁴ 7s²",
		discoveryYear: "1958",
		namedAfter: "Alfred Nobel",
		row: 10,
		col: 16,
	},
	{
		atomicNumber: 103,
		symbol: "Lr",
		name: "Lawrencium",
		atomicMass: "266",
		category: "actinide",
		electronConfig: "[Rn] 5f¹⁴ 7s² 7p¹",
		discoveryYear: "1961",
		namedAfter: "Ernest Lawrence",
		row: 10,
		col: 17,
	},
	{
		atomicNumber: 104,
		symbol: "Rf",
		name: "Rutherfordium",
		atomicMass: "267",
		category: "transition-metal",
		electronConfig: "[Rn] 5f¹⁴ 6d² 7s²",
		discoveryYear: "1964",
		namedAfter: "Ernest Rutherford",
		row: 7,
		col: 4,
	},
	{
		atomicNumber: 105,
		symbol: "Db",
		name: "Dubnium",
		atomicMass: "268",
		category: "transition-metal",
		electronConfig: "[Rn] 5f¹⁴ 6d³ 7s²",
		discoveryYear: "1967",
		namedAfter: "Dubna, Russia",
		row: 7,
		col: 5,
	},
	{
		atomicNumber: 106,
		symbol: "Sg",
		name: "Seaborgium",
		atomicMass: "269",
		category: "transition-metal",
		electronConfig: "[Rn] 5f¹⁴ 6d⁴ 7s²",
		discoveryYear: "1974",
		namedAfter: "Glenn Seaborg",
		row: 7,
		col: 6,
	},
	{
		atomicNumber: 107,
		symbol: "Bh",
		name: "Bohrium",
		atomicMass: "270",
		category: "transition-metal",
		electronConfig: "[Rn] 5f¹⁴ 6d⁵ 7s²",
		discoveryYear: "1981",
		namedAfter: "Niels Bohr",
		row: 7,
		col: 7,
	},
	{
		atomicNumber: 108,
		symbol: "Hs",
		name: "Hassium",
		atomicMass: "277",
		category: "transition-metal",
		electronConfig: "[Rn] 5f¹⁴ 6d⁶ 7s²",
		discoveryYear: "1984",
		namedAfter: "Hesse, Germany",
		row: 7,
		col: 8,
	},
	{
		atomicNumber: 109,
		symbol: "Mt",
		name: "Meitnerium",
		atomicMass: "278",
		category: "unknown",
		electronConfig: "[Rn] 5f¹⁴ 6d⁷ 7s²",
		discoveryYear: "1982",
		namedAfter: "Lise Meitner",
		row: 7,
		col: 9,
	},
	{
		atomicNumber: 110,
		symbol: "Ds",
		name: "Darmstadtium",
		atomicMass: "281",
		category: "unknown",
		electronConfig: "[Rn] 5f¹⁴ 6d⁸ 7s²",
		discoveryYear: "1994",
		namedAfter: "Darmstadt, Germany",
		row: 7,
		col: 10,
	},
	{
		atomicNumber: 111,
		symbol: "Rg",
		name: "Roentgenium",
		atomicMass: "282",
		category: "unknown",
		electronConfig: "[Rn] 5f¹⁴ 6d⁹ 7s²",
		discoveryYear: "1994",
		namedAfter: "Wilhelm Röntgen",
		row: 7,
		col: 11,
	},
	{
		atomicNumber: 112,
		symbol: "Cn",
		name: "Copernicium",
		atomicMass: "285",
		category: "unknown",
		electronConfig: "[Rn] 5f¹⁴ 6d¹⁰ 7s²",
		discoveryYear: "1996",
		namedAfter: "Copernicus",
		row: 7,
		col: 12,
	},
	{
		atomicNumber: 113,
		symbol: "Nh",
		name: "Nihonium",
		atomicMass: "286",
		category: "unknown",
		electronConfig: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p¹",
		discoveryYear: "2003",
		namedAfter: "Nihon (Japan)",
		row: 7,
		col: 13,
	},
	{
		atomicNumber: 114,
		symbol: "Fl",
		name: "Flerovium",
		atomicMass: "289",
		category: "unknown",
		electronConfig: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p²",
		discoveryYear: "1998",
		namedAfter: "Flerov Laboratory",
		row: 7,
		col: 14,
	},
	{
		atomicNumber: 115,
		symbol: "Mc",
		name: "Moscovium",
		atomicMass: "290",
		category: "unknown",
		electronConfig: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p³",
		discoveryYear: "2003",
		namedAfter: "Moscow",
		row: 7,
		col: 15,
	},
	{
		atomicNumber: 116,
		symbol: "Lv",
		name: "Livermorium",
		atomicMass: "293",
		category: "unknown",
		electronConfig: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁴",
		discoveryYear: "2000",
		namedAfter: "Livermore, California",
		row: 7,
		col: 16,
	},
	{
		atomicNumber: 117,
		symbol: "Ts",
		name: "Tennessine",
		atomicMass: "294",
		category: "unknown",
		electronConfig: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁵",
		discoveryYear: "2010",
		namedAfter: "Tennessee",
		row: 7,
		col: 17,
	},
	{
		atomicNumber: 118,
		symbol: "Og",
		name: "Oganesson",
		atomicMass: "294",
		category: "unknown",
		electronConfig: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶",
		discoveryYear: "2002",
		namedAfter: "Yuri Oganessian",
		row: 7,
		col: 18,
	},
];

const easeOutQuart = [0.25, 1, 0.5, 1] as const;
const easeOutQuint = [0.22, 1, 0.36, 1] as const;
const easeOutExpo = [0.16, 1, 0.3, 1] as const;
const easeOutBack = [0.34, 1.56, 0.64, 1] as const;

const categoryConfig: Record<
	string,
	{ bg: string; glow: string; label: string; rgb: string }
> = {
	"alkali-metal": {
		bg: "bg-red-500/90",
		glow: "shadow-[0_0_20px_rgba(239,68,68,0.6)]",
		label: "Alkali",
		rgb: "239, 68, 68",
	},
	"alkaline-earth": {
		bg: "bg-orange-500/90",
		glow: "shadow-[0_0_20px_rgba(249,115,22,0.6)]",
		label: "Alkaline",
		rgb: "249, 115, 22",
	},
	"transition-metal": {
		bg: "bg-yellow-500/90",
		glow: "shadow-[0_0_20px_rgba(234,179,8,0.6)]",
		label: "Transition",
		rgb: "234, 179, 8",
	},
	"post-transition": {
		bg: "bg-green-500/90",
		glow: "shadow-[0_0_20px_rgba(34,197,94,0.6)]",
		label: "Post-Trans",
		rgb: "34, 197, 94",
	},
	metalloid: {
		bg: "bg-teal-500/90",
		glow: "shadow-[0_0_20px_rgba(20,184,166,0.6)]",
		label: "Metalloid",
		rgb: "20, 184, 166",
	},
	nonmetal: {
		bg: "bg-cyan-500/90",
		glow: "shadow-[0_0_20px_rgba(6,182,212,0.6)]",
		label: "Nonmetal",
		rgb: "6, 182, 212",
	},
	halogen: {
		bg: "bg-blue-500/90",
		glow: "shadow-[0_0_20px_rgba(59,130,246,0.6)]",
		label: "Halogen",
		rgb: "59, 130, 246",
	},
	"noble-gas": {
		bg: "bg-indigo-500/90",
		glow: "shadow-[0_0_20px_rgba(99,102,241,0.6)]",
		label: "Noble Gas",
		rgb: "99, 102, 241",
	},
	lanthanide: {
		bg: "bg-purple-500/90",
		glow: "shadow-[0_0_20px_rgba(168,85,247,0.6)]",
		label: "Lanthanide",
		rgb: "168, 85, 247",
	},
	actinide: {
		bg: "bg-pink-500/90",
		glow: "shadow-[0_0_20px_rgba(236,72,153,0.6)]",
		label: "Actinide",
		rgb: "236, 72, 153",
	},
	unknown: {
		bg: "bg-gray-500/90",
		glow: "shadow-[0_0_20px_rgba(156,163,175,0.6)]",
		label: "Unknown",
		rgb: "156, 163, 175",
	},
};

export function PeriodicTable() {
	const [selectedElement, setSelectedElement] = useState<Element | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [activeCategory, setActiveCategory] = useState<string | null>(null);
	const [isSearchFocused, setIsSearchFocused] = useState(false);
	const [interestingFact, setInterestingFact] = useState<string | null>(null);

	const filteredElements = useMemo(() => {
		return elements.filter((el) => {
			const matchesSearch =
				searchQuery === "" ||
				el.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				el.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
				el.atomicNumber.toString().includes(searchQuery);
			const matchesCategory = !activeCategory || el.category === activeCategory;
			return matchesSearch && matchesCategory;
		});
	}, [searchQuery, activeCategory]);

	const isFiltered = searchQuery !== "" || activeCategory !== null;

	const getBg = (category: string) =>
		categoryConfig[category]?.bg || "bg-gray-500/90";

	const ElementCard = ({ el }: { el: Element }) => {
		const isActive =
			filteredElements.some((e) => e.atomicNumber === el.atomicNumber) ||
			isFiltered === false;
		const [isHovered, setIsHovered] = useState(false);
		const scale = useSpring(1, { stiffness: 400, damping: 30 });
		const glowIntensity = useSpring(0, { stiffness: 300, damping: 25 });

		useEffect(() => {
			if (isHovered && isActive) {
				glowIntensity.set(1);
			} else {
				glowIntensity.set(0);
			}
		}, [isHovered, isActive, glowIntensity]);

		const boxShadow = useTransform(
			glowIntensity,
			[0, 1],
			[
				`0 0 12px rgba(${categoryConfig[el.category]?.rgb}, 0.4)`,
				`0 0 24px rgba(${categoryConfig[el.category]?.rgb}, 0.8), 0 0 48px rgba(${categoryConfig[el.category]?.rgb}, 0.4)`,
			],
		);

		const symbolScale = useTransform(glowIntensity, [0, 1], [1, 1.05]);

		return (
			<motion.button
				key={el.atomicNumber}
				onClick={() => setSelectedElement(el)}
				onHoverStart={() => setIsHovered(true)}
				onHoverEnd={() => setIsHovered(false)}
				style={{ scale, boxShadow }}
				initial={{ opacity: 0, scale: 0.8, y: 10 }}
				animate={{
					opacity: isActive ? 1 : 0.15,
					scale: 1,
					y: 0,
				}}
				transition={{
					duration: 0.35,
					delay: (el.atomicNumber % 20) * 0.015,
					ease: easeOutQuint,
				}}
				whileTap={isActive ? { scale: 0.95 } : {}}
				className={`
          relative flex flex-col items-center justify-center
          ${getBg(el.category)}
          rounded-2xl border border-white/10
          aspect-square p-2 cursor-pointer
        `}
			>
				<span className="absolute top-1.5 left-2 text-[10px] font-bold opacity-50 tabular-nums">
					{el.atomicNumber}
				</span>
				<motion.span
					style={{ scale: symbolScale }}
					className="font-bold text-white text-xl drop-shadow-lg"
				>
					{el.symbol}
				</motion.span>
				<span className="text-[9px] opacity-60 mt-0.5 text-center leading-tight">
					{el.name}
				</span>
				<div
					className="absolute inset-0 rounded-2xl pointer-events-none"
					style={{
						background:
							"radial-gradient(circle at 50% 0%, rgba(255,255,255,0.12) 0%, transparent 50%)",
					}}
				/>
			</motion.button>
		);
	};

	const displayedElements = isFiltered ? filteredElements : elements;

// Generate interesting fact when element is selected
useEffect(() => {
	if (selectedElement) {
		setInterestingFact(null); // Reset fact when new element selected
		
		// Generate interesting fact
		const generateFact = async () => {
			try {
				// Try to generate fact via our API route
				const response = await fetch(`/api/generate-element-fact`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						element: {
							atomicNumber: selectedElement.atomicNumber,
							name: selectedElement.name,
							symbol: selectedElement.symbol,
						},
					}),
				});

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const data = await response.json();
				if (data.fact) {
					setInterestingFact(data.fact);
				} else {
					setInterestingFact(null);
				}
			} catch (error) {
				console.error('Failed to generate interesting fact:', error);
				setInterestingFact(null);
			}
		};

		generateFact();
	}
}, [selectedElement]);

	return (
		<div
			className="min-h-screen bg-[#0a0a0f] text-white p-4 pb-24"
			style={{
				backgroundImage:
					"radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 60%)",
			}}
		>
			<div className="max-w-5xl mx-auto">
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.15, duration: 0.4, ease: easeOutQuart }}
					className="relative mb-4"
				>
					<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
					<input
						type="text"
						placeholder="Search by name, symbol, or number..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						onFocus={() => setIsSearchFocused(true)}
						onBlur={() => setIsSearchFocused(false)}
						className={`
              w-full pl-12 pr-10 py-3 rounded-2xl
              bg-white/5 border border-white/10
              text-white placeholder-gray-400 text-sm
              focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20
              transition-all duration-300
              ${isSearchFocused ? "bg-white/10 border-indigo-500/30" : ""}
            `}
					/>
					{searchQuery && (
						<motion.button
							initial={{ opacity: 0, scale: 0.5 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.5 }}
							onClick={() => setSearchQuery("")}
							className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10"
							whileTap={{ scale: 0.85 }}
						>
							<X className="w-4 h-4 text-gray-400" />
						</motion.button>
					)}
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.25, duration: 0.35, ease: easeOutQuart }}
					className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide"
				>
					<motion.button
						onClick={() =>
							setActiveCategory(activeCategory === null ? null : null)
						}
						className={`
              flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium
              border transition-all duration-200
              ${
								activeCategory === null
									? "bg-white/20 border-white/30 text-white"
									: "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
							}
            `}
						whileTap={{ scale: 0.95 }}
					>
						All
					</motion.button>
					{Object.entries(categoryConfig).map(([key, config], index) => (
						<motion.button
							key={key}
							onClick={() =>
								setActiveCategory(activeCategory === key ? null : key)
							}
							initial={{ opacity: 0, scale: 0.8 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{
								delay: 0.3 + index * 0.03,
								duration: 0.3,
								ease: easeOutQuint,
							}}
							className={`
              flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium
              border transition-all duration-200 flex items-center gap-1.5
              ${
								activeCategory === key
									? "bg-white/20 border-white/30 text-white"
									: "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
							}
            `}
							whileTap={{ scale: 0.95 }}
						>
							<motion.span
								className={`w-2.5 h-2.5 rounded-full ${config.bg.replace(
									"/90",
									"",
								)}`}
								animate={
									activeCategory === key ? { scale: [1, 1.3, 1] } : { scale: 1 }
								}
								transition={{ duration: 0.2 }}
							/>
							{config.label}
						</motion.button>
					))}
				</motion.div>

				<motion.div
					className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-9"
					initial="hidden"
					animate="visible"
					variants={{
						visible: { transition: { staggerChildren: 0.02 } },
						hidden: {},
					}}
				>
					{displayedElements.map((el) => (
						<ElementCard key={el.atomicNumber} el={el} />
					))}
				</motion.div>
			</div>

			<AnimatePresence>
				{selectedElement && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.25, ease: easeOutQuart }}
						className="fixed inset-0 z-50 flex items-center justify-center p-4"
						style={{
							background: "rgba(0,0,0,0.8)",
							backdropFilter: "blur(12px)",
						}}
						onClick={() => setSelectedElement(null)}
					>
						<motion.div
							initial={{ opacity: 0, scale: 0.85, y: 30 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.92, y: 15 }}
							transition={{
								duration: 0.4,
								ease: easeOutExpo,
							}}
							onClick={(e) => e.stopPropagation()}
							className={`
                relative w-full max-w-md rounded-3xl overflow-hidden
                bg-gradient-to-b from-[#0f0f18] to-[#0a0a0f]
                border
              `}
							style={{
								borderColor: `rgba(${categoryConfig[selectedElement.category]?.rgb}, 0.25)`,
								boxShadow: `0 0 80px rgba(${categoryConfig[selectedElement.category]?.rgb}, 0.2), 0 0 160px rgba(${categoryConfig[selectedElement.category]?.rgb}, 0.08)`,
							}}
						>
							<div
								className={`absolute top-0 left-0 right-0 h-1`}
								style={{
									background: `linear-gradient(90deg, rgba(${categoryConfig[selectedElement.category]?.rgb}, 0.6), rgba(${categoryConfig[selectedElement.category]?.rgb}, 1))`,
								}}
							/>

							<motion.button
								onClick={() => setSelectedElement(null)}
								className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 z-10"
								whileHover={{
									scale: 1.1,
									backgroundColor: "rgba(255,255,255,0.15)",
								}}
								whileTap={{ scale: 0.9 }}
								transition={{ duration: 0.15 }}
							>
								<X className="w-5 h-5" />
							</motion.button>

							<div className="p-6 pt-8">
								<motion.div
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{
										delay: 0.1,
										duration: 0.35,
										ease: easeOutQuint,
									}}
									className="flex items-start gap-5 mb-6"
								>
									<motion.div
										initial={{ scale: 0.8, rotate: -10 }}
										animate={{ scale: 1, rotate: 0 }}
										transition={{
											delay: 0.05,
											duration: 0.4,
											ease: easeOutBack,
										}}
										className={`
                    w-20 h-20 rounded-2xl flex items-center justify-center
                    ${getBg(selectedElement.category)}
                  `}
										style={{
											boxShadow: `0 0 30px rgba(${categoryConfig[selectedElement.category]?.rgb}, 0.5), 0 0 60px rgba(${categoryConfig[selectedElement.category]?.rgb}, 0.25)`,
										}}
									>
										<span className="text-3xl font-bold text-white">
											{selectedElement.symbol}
										</span>
									</motion.div>
									<div className="flex-1 pt-1">
										<h2 className="text-2xl font-bold mb-1">
											{selectedElement.name}
										</h2>
										<p className="text-sm text-gray-400">
											Atomic Number {selectedElement.atomicNumber}
										</p>
										<p className="text-sm text-gray-400 tabular-nums">
											{selectedElement.atomicMass} u
										</p>
									</div>
								</motion.div>

								<div className="grid grid-cols-2 gap-3 mb-4">
									<motion.div
										initial={{ opacity: 0, y: 15 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{
											delay: 0.15,
											duration: 0.3,
											ease: easeOutQuart,
										}}
										className="p-4 rounded-xl bg-white/5 border border-white/5"
									>
										<p className="text-xs text-gray-500 mb-1.5">Category</p>
										<p className="font-semibold text-sm">
											{categoryConfig[selectedElement.category]?.label ||
												selectedElement.category}
										</p>
									</motion.div>
									<motion.div
										initial={{ opacity: 0, y: 15 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{
											delay: 0.18,
											duration: 0.3,
											ease: easeOutQuart,
										}}
										className="p-4 rounded-xl bg-white/5 border border-white/5"
									>
										<p className="text-xs text-gray-500 mb-1.5">
											Electron Config
										</p>
										<p className="font-semibold text-sm">
											{selectedElement.electronConfig}
										</p>
									</motion.div>
								</div>

								<motion.div
									initial={{ opacity: 0, y: 15 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{
										delay: 0.22,
										duration: 0.3,
										ease: easeOutQuart,
									}}
									className="p-4 rounded-xl bg-white/5 border border-white/5"
								>
									<p className="text-xs text-gray-500 mb-1.5">Discovery</p>
									<p className="font-semibold text-sm mb-1">
										{selectedElement.discoveryYear}
									</p>
									<p className="text-xs text-gray-400 leading-relaxed">
										{selectedElement.namedAfter}
									</p>
								</motion.div>
								
								{interestingFact && (
									<motion.div
										initial={{ opacity: 0, y: 15 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{
											delay: 0.26,
											duration: 0.3,
											ease: easeOutQuart,
										}}
										className="p-4 rounded-xl bg-white/5 border border-white/5"
									>
										<p className="text-xs text-gray-500 mb-1.5">
											Did You Know?
										</p>
										<p className="text-sm text-gray-300 leading-relaxed">
											{interestingFact}
										</p>
									</motion.div>
								)}
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			<style jsx>{`
				.scrollbar-hide::-webkit-scrollbar {
					display: none;
				}
				.scrollbar-hide {
					-ms-overflow-style: none;
					scrollbar-width: none;
				}
				@media (prefers-reduced-motion: reduce) {
					* {
						animation-duration: 0.01ms !important;
						animation-iteration-count: 1 !important;
						transition-duration: 0.01ms !important;
					}
				}
			`}</style>
		</div>
	);
}
