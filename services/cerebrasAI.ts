const CEREBRAS_KEY = 'csk-26yxexc3ev3hkff4j86pn59ry6h69md5tyv4hkn6knp66yyf';
const CEREBRAS_MODEL = 'gpt-oss-120b';

const cleanHTML = (text: string): string => {
  if (!text) return '';
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```html\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
  return cleaned.trim();
};

export const formatArticleWithCerebras = async (title: string, content: string): Promise<string> => {
  if (!content) return '';

  const systemPrompt = `أنت خبير تصوير فكري ومحرر نصوص صحفية لـ "ملتقى الشباب المسلم".
مهمتك: إعادة ترتيب وتنسيق المقال ليصبح راقياً وجذاباً بصرياً وثرياً بالتصاميم الملونة والاقتباسات بأسلوب HTML5.

قواعد التنسيق المطلوبة:
1. استخدم الفقرات <p style="margin-bottom: 1.25rem; line-height: 1.8;"> للنص العادي.
2. استخدم الاقتباس الذهبي البارز للاقتباسات أو الحِكم:
   <blockquote style="border-right: 5px solid #d4a045; background-color: rgba(212, 160, 69, 0.15); padding: 1rem 1.25rem; border-radius: 0.75rem; margin: 1.25rem 0; font-style: italic; font-weight: 600; color: #d4a045;">نص الاقتباس الذهبي</blockquote>
3. استخدم الإطار الزمردي المظلل للفوائد الهامة والشرعية:
   <div style="border: 1px solid rgba(4, 120, 87, 0.5); background-color: rgba(4, 120, 87, 0.15); padding: 1rem 1.25rem; border-radius: 0.75rem; margin: 1.25rem 0; font-weight: 500; color: #047857;">نص الفائدة الزمردية</div>
4. ضع عناوين جانبية ملونة وجذابة للعناوين الرئيسية والفرعية:
   <h3 style="font-size: 1.3rem; font-weight: bold; color: #047857; margin-top: 1.5rem; margin-bottom: 0.75rem; border-bottom: 2px solid rgba(4, 120, 87, 0.3); padding-bottom: 0.25rem;">العنوان الجانبي</h3>
5. صحح الأخطاء الإملائية والنحوية وحافظ على المعنى بدقة دون اختصار المضمون.
6. أخرج فقط كود الـ HTML المنسق لفقرات المقال مباشرة دون أي نصوص تمهيدية أو ختامية أو علامات markdown (لا تستخدم \`\`\`html).`;

  const userPrompt = `عنوان المقال: "${title || 'بدون عنوان'}"\n\nنص المقال:\n${content}`;

  // Direct Cerebras client call for immediate speed
  try {
    const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CEREBRAS_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: CEREBRAS_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3
      })
    });

    if (res.ok) {
      const data = await res.json();
      const rawText = data.choices?.[0]?.message?.content || '';
      if (rawText) {
        return cleanHTML(rawText);
      }
    }
  } catch (err) {
    console.warn('[Cerebras Direct Call Warning]:', err);
  }

  // Fallback to backend API endpoint
  try {
    const backendRes = await fetch('/api/ai/format-article', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content })
    });
    if (backendRes.ok) {
      const bData = await backendRes.json();
      if (bData.formattedContent) return cleanHTML(bData.formattedContent);
    }
  } catch (err) {
    console.error('[Cerebras Backend Fallback Error]:', err);
  }

  return content;
};

export const formatInitiativeWithCerebras = async (title: string, description: string): Promise<{ description: string; vision: string }> => {
  if (!title) return { description, vision: '' };

  const systemPrompt = `أنت مخطط ومصمم مبادرات شبابية خبير في ملتقى الشباب المسلم.
قم بصياغة وتنسيق معلومات المبادرة التالية وتوليد الرؤية والأهداف بشكل احترافي وجذاب.
أرجع النتيجة بصيغة JSON حصرية بالشكل التالي فقط:
{
  "description": "الشرح المختصر والمقدمة الجذابة للمبادرة",
  "vision": "الرؤية والأهداف التفصيلية بر نقاط محددة ومنسقة"
}`;

  const userPrompt = `اسم المبادرة: "${title}"\nالوصف المبدئي: "${description || ''}"`;

  try {
    const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CEREBRAS_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: CEREBRAS_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3
      })
    });

    if (res.ok) {
      const data = await res.json();
      let rawText = data.choices?.[0]?.message?.content || '';
      rawText = cleanHTML(rawText);
      if (rawText.startsWith('```json')) {
        rawText = rawText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      }
      try {
        const parsed = JSON.parse(rawText);
        return { description: parsed.description || description, vision: parsed.vision || '' };
      } catch {
        return { description: rawText, vision: '' };
      }
    }
  } catch (err) {
    console.warn('[Cerebras Direct Initiative Call Error]:', err);
  }

  return { description, vision: '' };
};
