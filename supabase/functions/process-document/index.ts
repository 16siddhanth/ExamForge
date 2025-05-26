import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.17.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Declare Deno global
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Parse the multipart form data
    const formData = await req.formData();
    
    const file = formData.get('file') as File;
    const subjectId = formData.get('subjectId') as string;
    const fileName = formData.get('fileName') as string;
    
    if (!file || !subjectId || !fileName) {
      throw new Error('Missing required fields: file, subjectId, or fileName');
    }

    console.log('📄 Received direct upload:', {
      fileName,
      fileSize: file.size,
      fileType: file.type,
      subjectId
    });

    // Check file size limits for direct processing
    const directProcessingLimit = 5 * 1024 * 1024; // 5MB
    const isDirectProcessing = file.size <= directProcessingLimit;

    console.log(`🎯 Processing mode: ${isDirectProcessing ? 'DIRECT' : 'STORAGE'} (${file.size} bytes)`);

    let document;
    let fileData: Blob;

    if (isDirectProcessing) {
      // Direct processing for small files (like your 650KB PDFs)
      console.log('⚡ Using direct processing mode - no storage upload needed');
      
      // Get user ID from auth header
      const authHeader = req.headers.get('Authorization');
      const token = authHeader?.split(' ')[1];
      
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
      if (userError || !user) {
        throw new Error('Authentication failed');
      }

      // Create document record (without file_path initially)
      const { data: docData, error: dbError } = await supabaseClient
        .from('documents')
        .insert({
          user_id: user.id,
          subject_id: subjectId,
          name: fileName,
          file_size: file.size,
          file_type: file.type,
          status: 'processing'
        })
        .select()
        .single();

      if (dbError) throw dbError;
      document = docData;
      fileData = file;

    } else {
      // Fall back to storage for large files
      console.log('📦 Using storage mode for large file');
      
      // Get user ID from auth header
      const authHeader = req.headers.get('Authorization');
      const token = authHeader?.split(' ')[1];
      
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
      if (userError || !user) {
        throw new Error('Authentication failed');
      }

      // Upload to storage first
      const filePath = `${user.id}/${Date.now()}-${fileName}`;
      const { error: uploadError } = await supabaseClient.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record with file_path
      const { data: docData, error: dbError } = await supabaseClient
        .from('documents')
        .insert({
          user_id: user.id,
          subject_id: subjectId,
          name: fileName,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          status: 'processing'
        })
        .select()
        .single();

      if (dbError) throw dbError;
      document = docData;

      // Download from storage for processing
      const { data: downloadData, error: downloadError } = await supabaseClient.storage
        .from('documents')
        .download(filePath);

      if (downloadError) throw downloadError;
      fileData = downloadData;
    }

    // Extract text using Gemini OCR
    let text = '';
    
    if (document.file_type === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
      console.log('📄 Using Gemini Flash OCR for PDF text extraction...');
      try {
        text = await extractTextWithGemini(fileData, fileName);
        console.log('✅ Successfully extracted text using Gemini Flash OCR');
        console.log('📄 Text length:', text.length);
        
      } catch (error) {
        console.error('❌ Gemini OCR failed:', error.message);
        console.log('🔄 Falling back to basic text extraction...');
        
        // Fallback to basic text extraction
        try {
          text = await fileData.text();
          
          // Clean up basic extraction
          text = text.replace(/[\x00-\x1F\x7F]/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                    
          const words = text.split(/\s+/).filter(word => 
            word.length > 2 && 
            !/^[^a-zA-Z]*$/.test(word) && 
            !word.includes('obj') && 
            !word.includes('endobj')
          );
          
          text = words.join(' ');
          console.log('📄 Basic extraction completed:', words.length, 'words');
          
        } catch (fallbackError) {
          console.error('❌ Basic text extraction also failed:', fallbackError.message);
          throw new Error('All text extraction methods failed. Please ensure the PDF contains readable text.');
        }
      }
    } else {
      // For non-PDF files, use basic text extraction
      console.log('📄 Processing non-PDF file...');
      text = await fileData.text();
    }

    if (text.length < 50) {
      throw new Error('Insufficient text content extracted from document. Please ensure the document contains readable text.');
    }

    // For direct processing, optionally save to storage now that we know it's valid
    if (isDirectProcessing) {
      try {
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.split(' ')[1];
        
        const { data: { user } } = await supabaseClient.auth.getUser(token);
        const filePath = `${user?.id}/${Date.now()}-${fileName}`;
        
        const { error: storageError } = await supabaseClient.storage
          .from('documents')
          .upload(filePath, file);

        if (!storageError) {
          // Update document with file_path
          await supabaseClient
            .from('documents')
            .update({ file_path: filePath })
            .eq('id', document.id);
          console.log('💾 Saved file to storage for archival');
        } else {
          console.warn('⚠️ Could not save to storage:', storageError.message);
        }
      } catch (storageException) {
        console.warn('⚠️ Storage save failed:', storageException.message);
        // Don't fail the entire operation
      }
    }
    
    // Update document with extracted text
    try {
      const { error: updateError } = await supabaseClient
        .from('documents')
        .update({ 
          extracted_text: text,
          status: 'processing'
        })
        .eq('id', document.id);

      if (updateError) {
        console.error('⚠️ Failed to update document with extracted text:', updateError.message);
      } else {
        console.log('✅ Document updated with extracted text');
      }
    } catch (updateException) {
      console.error('⚠️ Exception during document update:', updateException.message);
    }

    // Generate questions using Gemini AI
    let questions;
    try {
      console.log('🤖 Starting Gemini question generation...');
      questions = await generateQuestionsWithGemini(text);
      console.log('🎯 Generated', questions.length, 'questions from Gemini');
    } catch (error) {
      console.error('❌ Error generating questions with Gemini:', error.message);
      console.log('🔄 Falling back to simple generation');
      questions = generateQuestionsFromText(text);
    }

    // Save questions to database
    let savedQuestions = 0;
    
    for (const question of questions) {
      try {
        const { error: insertError } = await supabaseClient
          .from('questions')
          .insert({
            user_id: document.user_id,
            document_id: document.id,
            question_text: question.question,
            options: question.options,
            correct_answer: question.correct_answer,
            explanation: question.explanation,
            difficulty_level: question.difficulty
          });

        if (insertError) {
          console.error('⚠️ Failed to save question:', insertError.message);
        } else {
          savedQuestions++;
        }
      } catch (insertException) {
        console.error('⚠️ Exception saving question:', insertException.message);
      }
    }

    // Final document status update
    try {
      const finalStatus = savedQuestions > 0 ? 'completed' : 'failed';
      await supabaseClient
        .from('documents')
        .update({ 
          status: finalStatus,
          questions_generated: savedQuestions
        })
        .eq('id', document.id);
      console.log(`✅ Document final status updated to: ${finalStatus}`);
    } catch (finalUpdateError) {
      console.error('⚠️ Failed to update final document status:', finalUpdateError.message);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        questionsGenerated: savedQuestions,
        totalQuestions: questions.length,
        extractedText: text.substring(0, 200) + '...',
        processingMode: isDirectProcessing ? 'direct_processing' : 'storage_processing',
        documentId: document.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('❌ Processing error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});

async function generateQuestionsWithGemini(text: string) {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are an expert academic question generator. Analyze this document and generate high-quality exam-style questions that match the academic level and subject matter.

ANALYZE THE DOCUMENT:
- Identify the subject/domain (e.g., Mathematics, Physics, Economics, etc.)
- Determine the academic level (school, undergraduate, graduate)
- Note the style and complexity of content
- Identify key concepts, theories, formulas, and important topics

GENERATE TWO TYPES OF QUESTIONS:

1. **Detailed Questions** (6-8 questions, 6-10 marks each):
   - Exam-style questions requiring detailed answers
   - Cover different topics/units from the document
   - Use academic terminology from the subject
   - Include "Explain", "Analyze", "Discuss", "Derive", "Compare" type questions
   - Provide comprehensive answers with examples

2. **Multiple Choice Questions** (4 options each):
   - Conceptual understanding
   - Factual recall
   - Application-based
   - Analysis-based

FORMAT YOUR RESPONSE AS VALID JSON (escape all quotes and special characters):
\`\`\`json
{
  "subject": "detected subject name",
  "detailed_questions": [
    {
      "question": "question text here",
      "marks": 8,
      "answer": "complete detailed answer with explanations and examples",
      "unit": "unit or topic name"
    }
  ],
  "mcq_questions": [
    {
      "question": "multiple choice question text",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "correct_answer": "Option A text",
      "explanation": "explanation for the correct answer"
    }
  ]
}
\`\`\`

IMPORTANT JSON FORMATTING RULES:
- Always wrap your JSON response in \`\`\`json code blocks
- Escape all quotes within strings using backslash (\\")
- Escape all backslashes using double backslash (\\\\)
- Use proper JSON syntax with no trailing commas
- Keep answers concise but comprehensive

REQUIREMENTS:
- Generate 5-7 detailed questions
- Generate 10-15 MCQs
- Ensure questions cover different topics/units from the document
- Make questions exam-appropriate and academically rigorous
- Include complete, accurate answers
- Use proper academic terminology

DOCUMENT CONTENT:
${text.substring(0, 50000)}

Generate high-quality exam questions now:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = await response.text();

    // Extract and clean JSON from response
    let jsonStr = '';
    
    const codeBlockMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1];
    } else {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
    }

    if (!jsonStr) {
      throw new Error('No JSON found in response');
    }
    
    let parsedData;
    try {
      parsedData = JSON.parse(jsonStr);
    } catch (error) {
      // Try to clean common JSON issues
      const cleanedJson = jsonStr
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t')
        .replace(/\\(?!["\\/bfnrt])/g, '\\\\');
      
      parsedData = JSON.parse(cleanedJson);
    }
    
    // Convert to the format expected by frontend
    const questions: any[] = [];
    
    // Add detailed questions as MCQs (since frontend expects MCQ format)
    if (parsedData.detailed_questions) {
      parsedData.detailed_questions.forEach((q: any) => {
        questions.push({
          question: `${q.question} (${q.marks || 8} Marks)`,
          options: [
            "A) " + (q.answer ? q.answer.substring(0, 100) + "..." : "Option A"),
            "B) Alternative explanation or approach",
            "C) Incorrect but plausible answer",
            "D) Another incorrect option"
          ],
          correct_answer: "A) " + (q.answer ? q.answer.substring(0, 100) + "..." : "Option A"),
          explanation: q.answer || "Detailed answer explanation",
          difficulty: Math.ceil((q.marks || 8) / 3),
          type: 'detailed',
          subject: parsedData.subject || 'General',
          unit: q.unit || 'General'
        });
      });
    }
    
    // Add MCQ questions
    if (parsedData.mcq_questions) {
      parsedData.mcq_questions.forEach((q: any) => {
        questions.push({
          question: q.question,
          options: q.options || ["Option A", "Option B", "Option C", "Option D"],
          correct_answer: q.correct_answer || q.options?.[0] || "Option A",
          explanation: q.explanation || "No explanation provided",
          difficulty: Math.floor(Math.random() * 3) + 1,
          type: 'mcq',
          subject: parsedData.subject || 'General'
        });
      });
    }
    
    if (questions.length === 0) {
      throw new Error('No questions generated from Gemini response');
    }
    
    return questions;
}

function generateQuestionsFromText(text: string) {
  const sentences = text.split('.').filter(s => s.trim().length > 20);
  const questions: any[] = [];

  for (let i = 0; i < Math.min(5, sentences.length); i++) {
    const sentence = sentences[i].trim();
    if (sentence.length > 30) {
      questions.push({
        question: `What does the following statement mean: "${sentence}"?`,
        options: [
          "Option A - First interpretation",
          "Option B - Second interpretation", 
          "Option C - Third interpretation",
          "Option D - Fourth interpretation"
        ],
        correct_answer: "Option A - First interpretation",
        explanation: "This is a generated explanation for the question.",
        difficulty: Math.floor(Math.random() * 3) + 1
      });
    }
  }

  return questions;
}

async function extractTextWithGemini(fileData: Blob, fileName: string): Promise<string> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  // Check file size limits - optimized for direct processing
  const maxSize = 5 * 1024 * 1024; // 5MB for direct processing
  if (fileData.size > maxSize) {
    throw new Error(`File too large for direct OCR processing. Maximum size: ${maxSize / (1024 * 1024)}MB`);
  }
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  console.log('📄 Converting file to base64 (size:', fileData.size, 'bytes)...');
  
  // Optimized base64 conversion for smaller files
  const arrayBuffer = await fileData.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  
  // For files under 1MB, use simple conversion
  let base64Data = '';
  if (fileData.size < 1024 * 1024) {
    console.log('⚡ Using fast conversion for small file');
    // Use binary string approach to avoid encoding issues
    const binaryString = Array.from(uint8Array, byte => String.fromCharCode(byte)).join('');
    base64Data = btoa(binaryString);
  } else {
    console.log('🔄 Using chunked conversion for larger file');
    // Use chunked approach for files 1MB-5MB
    const chunkSize = 8192;
    const base64Chunks: string[] = [];
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      const binaryChunk = Array.from(chunk, byte => String.fromCharCode(byte)).join('');
      base64Chunks.push(btoa(binaryChunk));
    }
    
    base64Data = base64Chunks.join('');
  }
  
  console.log('📊 Base64 conversion completed:', base64Data.length, 'characters');

  const prompt = `Please extract ALL text content from this PDF document. 

INSTRUCTIONS:
- Read every page of the document
- Extract all visible text including headers, footers, and captions
- Preserve the logical structure and formatting where possible
- Include mathematical formulas, equations, and symbols as text
- If there are tables, preserve the table structure
- If there are diagrams or images with text, extract any visible text
- Maintain paragraph breaks and section divisions
- Include page numbers if visible

IMPORTANT:
- Return ONLY the extracted text content
- Do not add any commentary or explanations
- Do not describe what you see, just extract the text
- If text is unclear, make your best interpretation

Extract all text from this document:`;

  try {
    console.log('🚀 Sending PDF to Gemini for OCR text extraction...');
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: fileData.type || 'application/pdf'
        }
      }
    ]);
    
    const response = await result.response;
    
    if (response.promptFeedback?.blockReason) {
      throw new Error(`Content blocked by Gemini: ${response.promptFeedback.blockReason}`);
    }
    
    const extractedText = await response.text();
    
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text could be extracted from the document');
    }

    // Clean up the extracted text
    let cleanedText = extractedText
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s{3,}/g, ' ')
      .trim();

    const words = cleanedText.split(/\s+/).filter(word => word.length > 0);
    
    if (words.length < 10) {
      throw new Error('Insufficient text extracted. The document may be image-based or corrupted.');
    }

    console.log('✅ OCR text extraction successful');
    console.log('📊 Extracted', words.length, 'words from document');
    
    return cleanedText;

  } catch (error) {
    console.error('❌ Gemini OCR text extraction failed:', error.message);
    
    if (error.message.includes('RESOURCE_EXHAUSTED')) {
      throw new Error('Gemini API quota exceeded. Please try again later.');
    } else if (error.message.includes('INVALID_ARGUMENT')) {
      throw new Error('Invalid file format for OCR processing. Please ensure the PDF is not corrupted.');
    } else if (error.message.includes('PERMISSION_DENIED')) {
      throw new Error('Permission denied. Please check your Gemini API key.');
    } else {
      throw new Error(`Failed to extract text with Gemini OCR: ${error.message}`);
    }
  }
}
