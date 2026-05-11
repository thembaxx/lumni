#!/usr/bin/env tsx
import { convertMarkdownToJson } from "../src/lib/exam-parser";

const INPUT_DIR = process.argv[2] || "./markdown";
const OUTPUT_DIR = process.argv[3] || "./JSON";
convertMarkdownToJson(INPUT_DIR, OUTPUT_DIR);
