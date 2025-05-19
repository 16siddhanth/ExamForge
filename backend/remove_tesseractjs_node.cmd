@echo off
REM Remove tesseract.js-node type definition if present
if exist src\types\tesseract.js-node.d.ts del src\types\tesseract.js-node.d.ts
