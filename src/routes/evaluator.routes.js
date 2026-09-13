const express = require('express');
const { jodDescription,ResumeAnalyser } = require('../controllers/ai/ResumeEvaluator/evaluator.Controller.js');

const router = express.Router();

// router.get('/resume/jodanalyser', jodDescription);
router.post('/resume/analyser', ResumeAnalyser);

module.exports = router;