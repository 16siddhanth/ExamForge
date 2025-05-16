"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = __importDefault(require("../models/prisma"));
const router = express_1.default.Router();
router.get('/', async (req, res) => {
    const subjects = await prisma_1.default.subject.findMany();
    res.json(subjects);
});
router.post('/', async (req, res) => {
    const { name, mainTopics } = req.body;
    try {
        const subject = await prisma_1.default.subject.create({
            data: { name, mainTopics },
        });
        res.json(subject);
    }
    catch (err) {
        const message = (err && typeof err === 'object' && 'message' in err) ? err.message : String(err);
        res.status(400).json({ error: message });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const subject = await prisma_1.default.subject.findUnique({ where: { id: req.params.id } });
        if (!subject) {
            return res.status(404).json({ error: 'Subject not found' });
        }
        res.json(subject);
    }
    catch (err) {
        const message = (err && typeof err === 'object' && 'message' in err) ? err.message : String(err);
        res.status(400).json({ error: message });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        await prisma_1.default.subject.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch (err) {
        const message = (err && typeof err === 'object' && 'message' in err) ? err.message : String(err);
        res.status(400).json({ error: message });
    }
});
exports.default = router;
