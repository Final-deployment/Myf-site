const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY || 'csk-26yxexc3ev3hkff4j86pn59ry6h69md5tyv4hkn6knp66yyf';
const CEREBRAS_MODEL = 'gpt-oss-120b';

// Helper to call Cerebras API
const callCerebrasAI = async (messages) => {
    const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${CEREBRAS_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: CEREBRAS_MODEL,
            messages: messages,
            temperature: 0.3
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Cerebras API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
};

// Clean AI output from markdown code blocks
const cleanHTML = (text) => {
    if (!text) return '';
    let cleaned = text.trim();
    if (cleaned.startsWith('```html')) {
        cleaned = cleaned.replace(/^```html\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return cleaned.trim();
};

// 1. Format Article Content via Cerebras gpt-oss-120b
router.post('/format-article', async (req, res) => {
    try {
        const { title, content } = req.body;
        if (!content) {
            return res.status(400).json({ error: 'محتوى المقال مطلوب' });
        }

        const systemPrompt = `أنت خبير تصوير فكري ومحرر نصوص صحفية لـ "ملتقى الشباب المسلم".
مهمتك: إعادة ترتيب وتنسيق المقال المعطى ليصبح رائعاً وجذاباً بصرياً وثرياً بالتصاميم الملونة والاقتباسات بأسلوب HTML5.

قواعد التنسيق المطلوبة:
1. استخدم الفقرات <p className="mb-6 leading-relaxed"> للنص العادي.
2. استخدم الاقتباس الذهبي البارز للاقتباسات أو الحِكم:
   <blockquote className="border-r-4 border-[#d4a045] bg-[#d4a045]/10 p-4 rounded-xl my-4 text-base italic font-semibold">نص الاقتباس الذهبي</blockquote>
3. استخدم الإطار الزمردي المظلل للفوائد الهامة والشرعية:
   <div className="border border-[#047857]/40 bg-[#047857]/10 p-4 rounded-xl my-4 text-sm font-medium">نص الفائدة الزمردية</div>
4. ضع عناوين جانبية ملونة وجذابة للعناوين الرئيسية والفرعية:
   <h3 className="font-bold text-[#047857] text-xl mt-6 mb-3 border-b pb-1">العنوان الجانبي</h3>
5. صحح الأخطاء الإملائية والنحوية وحافظ على الأصل بدقة دون اختصار المضمون.
6. أخرج فقط كود الـ HTML المنسق لفقرات المقال مباشرة، بدون أي نصوص تمهيدية أو ختامية أو علامات markdown (لا تستخدم \`\`\`html).`;

        const userPrompt = `عنوان المقال: "${title || 'بدون عنوان'}"\n\nنص المقال:\n${content}`;

        const rawResult = await callCerebrasAI([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ]);

        const formattedContent = cleanHTML(rawResult);
        res.json({ success: true, formattedContent, modelUsed: CEREBRAS_MODEL });
    } catch (error) {
        console.error('[AI Cerebras Article Error]:', error);
        res.status(500).json({ error: 'فشل التنسيق عبر الذكاء الاصطناعي', details: error.message });
    }
});

// 2. Format / Structure Initiative via Cerebras gpt-oss-120b
router.post('/format-initiative', async (req, res) => {
    try {
        const { title, description } = req.body;
        if (!title) {
            return res.status(400).json({ error: 'اسم المبادرة مطلوب' });
        }

        const systemPrompt = `أنت مخطط ومصمم مبادرات شبابية خبير في ملتقى الشباب المسلم.
قم بصياغة وتنسيق معلومات المبادرة التالية وتوليد الرؤية والأهداف بشكل احترافي وجذاب.
أرجع النتيجة بصيغة JSON حصرية بالشكل التالي فقط:
{
  "description": "الشرح المختصر والمقدمة الجذابة للمبادرة",
  "vision": "الرؤية والأهداف التفصيلية بر نقاط محددة ومنسقة"
}`;

        const userPrompt = `اسم المبادرة: "${title}"\nالوصف المبدئي: "${description || ''}"`;

        const rawResult = await callCerebrasAI([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ]);

        let jsonStr = cleanHTML(rawResult);
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        }

        try {
            const parsed = JSON.parse(jsonStr);
            res.json({ success: true, description: parsed.description, vision: parsed.vision, modelUsed: CEREBRAS_MODEL });
        } catch {
            res.json({ success: true, description: jsonStr, vision: jsonStr, modelUsed: CEREBRAS_MODEL });
        }
    } catch (error) {
        console.error('[AI Cerebras Initiative Error]:', error);
        res.status(500).json({ error: 'فشل تصميم المبادرة عبر الذكاء الاصطناعي', details: error.message });
    }
});

module.exports = router;
