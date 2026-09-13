const Groq = require('groq-sdk');
const asyncHandler = require('../../../utils/asyncHandler');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const askLLM = async (system_prompt, user_prompt) => {
  try {
    const resCompletions = await groq.chat.completions.create({
      model: process.env.MODEl_AI,
      messages: [
        {
          role: "system",
          content: system_prompt,
        },
        {
          role: "user",
          content: user_prompt,
        },
      ],
      response_format: {
        type: "json_object",
      },
      temperature: 0,
    });
    const answer = resCompletions.choices[0].message.content;
    const result = {
      success: true,
      data: JSON.parse(answer),
    };
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};

const extractJd=async(resumeText)=>{
    const system_prompt = `
        You are an expert Technical Recruiter and ATS Job Description Analyzer.
        Your task is to extract accurate job requirements from a given Job Description.
        RULES:
        - Extract only skills explicitly mentioned in the Job Description.
        - Do not invent or assume any skills.
        - Include programming languages, frameworks, libraries, databases, cloud technologies, tools, and other technical skills.
        - Identify the minimum and maximum years of experience required.
        - If only "6+ years" is mentioned, minExperience should be "6 years" and maxExperience should be "".
        - If a range such as "6-10 years" is mentioned, minExperience should be "6 years" and maxExperience should be "10 years".
        - If experience is not mentioned, return empty strings.
        - Return ONLY valid JSON.
        - Do not return explanations, Markdown, or additional text.
        OUTPUT FORMAT:
        {
        "skills": [],
        "minExperience": "",
        "maxExperience": ""
        }
    `; 
    const user_prompt = `
        Analyze the following Job Description and extract the required skills and experience.
        <JOB_DESCRIPTION>
        ${resumeText}
        </JOB_DESCRIPTION>
    `;
    const result = await askLLM(system_prompt,user_prompt)
    return result
}

const extractResume = async(fileData)=>{
    const system_prompt = `
        You are an expert Technical Recruiter and ATS Resume Analyzer.

        Your task is to extract accurate personal details, skills, and experience
        from the given resume.

        RULES:
        - Extract only information explicitly present in the resume.
        - Do not invent or assume any information.
        - Extract the candidate's full name.
        - Extract phone number exactly as mentioned.
        - Extract email exactly as mentioned.
        - Extract total professional experience.
        - Extract all explicitly mentioned technical skills.
        - Do not add skills that are not present in the resume.
        - Return ONLY valid JSON.
        - Do not return Markdown.
        - Do not return explanations.

        Return the result as valid JSON using exactly this structure:

        {
        "candidateName": "",
        "candidatePhone": "",
        "candidateEmail": "",
        "totalExperience": "",
        "skills": []
        }

        The response MUST be valid JSON.
        ` 
    const user_prompt = `
        Analyze the following Resume and extract the required skills,personal detail and experience.
        <RESUME_DESCRIPTION>
        ${fileData}
        </RESUME_DESCRIPTION>
    `
    const result = await askLLM(system_prompt,user_prompt)
    return result
}

const evaluatorResume = async(jdData,resumeData)=>{
    const system_prompt=`
        You are an expert Technical Recruiter and ATS Resume Analyzer.
        Your task is to match accurate skills,and experience from a given Job Description.
        RULES:
        - Matched only skills of resume from a given Job skills.
        - Do not invent or assume any skills.
        - Include programming languages, frameworks, libraries, databases, cloud technologies, tools, and other technical skills.
        - Identify the minimum and maximum years of experience required.
        - If only "6+ years" is mentioned, minExperience should be "6 years" and maxExperience should be "".
        - If a range such as "6-10 years" is mentioned, minExperience should be "6 years" and maxExperience should be "10 years".
        - If experience is not mentioned, return empty strings.
        - Return ONLY valid JSON.
        - Do not return explanations, Markdown, or additional text.
        OUTPUT FORMAT:
        {
            name: '', 
            phone: '', 
            email: '', 
            totalExperience: '', 
            matchScore: 0, 
            relevance: 0(%), 
            skillsdensity:0(%),
            experienceMatch:0(%)
            selectionRecommendation: "", 
            matchQuality: 'Poor', 
            matchedSkills: [], 
            missingSkills: [], 
            experienceMatch: '', 
            strengths: [], 
            gaps: [], 
            resion:"detail in 80 words why selection/rejection",
            summary: 'Insufficient data provided in the resume and job description to perform an evaluation.'
        }
    `;
    const user_prompt=`
        Compare the following candidate resume with the job description.
        <RESUME_DESCRIPTION>
        ${resumeData}
        </RESUME_DESCRIPTION>
        <JOB_DESCRIPTION>
        ${jdData}
        </JOB_DESCRIPTION>
    `;
    const result = await askLLM(system_prompt,user_prompt)
    return result
}

const ResumeAnalyser= asyncHandler(async(req,res)=>{
    try {
        const {resumeText,fileData} = req.body
        const jdSkills = await extractJd(resumeText)
        const resumeSkills = await extractResume(fileData)
        const resumeJson = JSON.stringify(resumeSkills.data);
        const jdJson = JSON.stringify(jdSkills.data);
        const finalResult  = await evaluatorResume(jdJson,resumeJson);
        finalResult.selectionRecommendation = await scoreResult(finalResult.matchScore);
        res.status(200).json({
            success: true,
            data:finalResult.data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            data: '',
            message: 'Something went wrong'
        });
    }
})

const scoreResult=async(score)=>{
    let scoreData = ""
    if(score<50){
        scoreData = "Rejected"
    }else if (score > 50 && score < 70 ) {
        scoreData = "Selected"
    } else {
        scoreData = "Strong"
    }
    return scoreData
}

module.exports = { 
    ResumeAnalyser
};