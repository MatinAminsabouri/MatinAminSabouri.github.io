/**
 * build-notes-cards.mjs — transforms the synced Telegram posts
 * (assets/data/notes.json) into clean dev-log card items
 * (assets/data/notes.cards.json).
 *
 * Content (titles, excerpts, cleaned full_content, alt texts, tags) is
 * authored against the ground truth recovered from t.me embed pages.
 * Reading time is computed (~190 Persian words/min, min 1).
 */
import fs from 'node:fs/promises';

const notes = JSON.parse(await fs.readFile('assets/data/notes.json', 'utf8'));
const byId = new Map(notes.posts.map((p) => [p.id, p]));

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const display = (iso) => {
  const d = new Date(iso);
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${dd} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

const readingTime = (text) => {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 190))} min read`;
};

/* media: post id -> alt text. Posts absent from this map get media: null. */
const MEDIA_ALT = {
  701: 'دو مرد که یکی در حال زمزمه چیزی در گوش دیگری است؛ صحنه‌ای از یک گفت‌وگوی صمیمانه',
  703: 'اسکرین‌شات اپلیکیشن Gemini با مدل Argon High و پیام Look what you can do with Gemini 4',
  705: 'تصویر مفهومی مهاجرت از گیت به Scion؛ لوگوی Git و پشت آن لوگوی Scion با فلشی بین دو نمودار کامیت',
  706: 'دو مرد ریش‌دار که با فاصله‌ای بسیار نزدیک روبه‌روی هم نشسته‌اند',
  708: 'اتوبانی شلوغ زیر آسمان آبیِ پیش از غروب',
  711: 'اسکرین‌شات پیام تلگرامی با متن «زمستون کنار بخاری با این صدا داستان بشنویم» و حدود ۲٫۱ هزار بازدید',
  713: 'لپ‌تاپی روشن در تاریکی شب با کیبورد بک‌لایت‌دار و محیط کدنویسی روی صفحه',
  721: 'اسکرین‌شات پیام تلگرامی آقای نقوی درباره اهمیت مهندسی نرم‌افزار در عصر Agentها',
  722: 'نمای نزدیک از چهره بازیگری زن که خاک و غبار بر صورت و گردنش نشسته؛ در فضای تاریک و صنعتی (ظاهراً از سریال Silo)'
};

/* authored content, keyed by post id */
const CONTENT = {
  701: {
    title: 'برادر زد وسط خال',
    excerpt: 'وقتی یک مرد دقیقاً در گوش دیگری زمزمه می‌کند؛ همان لحظه‌ای که می‌شود گفت «درست وسط خال زد».',
    full_content: 'برادر زد وسط خال 🎯',
    tags: ['Humor', 'Personal']
  },
  702: {
    title: 'قدردانی از سلیقه موسیقی دوستان',
    excerpt: 'قدردانی از دوستانی که موزیک‌های خوب می‌فرستند؛ سلیقه‌های خوب شما روز را بهتر می‌کند. 🤝❤️',
    full_content: 'دست همه دوستانی که موزیک خوب می‌فرستند درد نکنه؛ قدردان سلیقه خوبتون هستم 🤝❤️',
    tags: ['Personal', 'Music']
  },
  703: {
    title: 'مدل پرچمدار جدید گوگل: آرگون یا آراگورن؟',
    excerpt: 'اسکرین‌شاتی از رابط Gemini 4 با مدل Argon High؛ نظرم این است که نامش باید آراگورن می‌بود، نه آرگون! پ.ن: خیلی قوی بود.',
    full_content: 'مدل پرچمدار جدید گوگل؛ آرگون ❌ آراگورن ✅\n\nپ.ن: خیلی قوی بود.',
    tags: ['AI', 'Gemini', 'Humor']
  },
  704: {
    title: 'کم‌کم باید با گیت هم خداحافظی کرد؟',
    excerpt: 'Anthropic مخزن داخلی‌اش را طی پنج ماه از گیت به سیستم Scion منتقل کرده؛ نشانه‌ای که آینده کنترل نسخه ممکن است کاملاً متفاوت باشد.',
    full_content: 'کم‌کم با گیت هم خداحافظی می‌کنیم :/\n\nhttps://www.anthropic.com/engineering/redesigning-source-control',
    tags: ['Git', 'AI', 'VersionControl']
  },
  705: {
    title: 'بازطراحی Source Control در عصر هوش مصنوعی',
    excerpt: 'وقتی AI کد را دوازده برابر سریع‌تر تولید می‌کند، گلوگاه به Code Review، تست و زیرساخت منتقل می‌شود؛ درس‌هایی از مهاجرت Anthropic از گیت به Scion.',
    full_content: 'اگر AI بتواند کد را ۱۲ برابر سریع‌تر تولید کند، آیا Git، Code Review و CI/CD ما هم برای چنین سرعتی آماده‌اند؟\nمقاله جدید Anthropic درباره بازطراحی Source Control یک نکته مهم دارد:\n\nدر عصر AI، ممکن است دیگر نوشتن کد گلوگاه اصلی توسعه نرم‌افزار نباشد؛ بلکه زیرساختی باشد که قرار است این حجم از کد را مدیریت کند.\n\nاعداد جالب‌اند:\n- تعداد تغییرات Merge‌شده در روز از حدود ۲٬۵۰۰ در مه ۲۰۲۶ به بیش از ۳۰٬۰۰۰ در سپتامبر رسید.\n- آن‌ها برای پاسخ به این مقیاس، سیستم کنترل نسخه داخلی خودشان را به نام Scion ساختند و طی پنج ماه، مخزن اصلی را از Git به آن منتقل کردند.\n- نتیجه؟ زیرساختی با مصرف CPU و حافظه حدود ۲۰۰ برابر کمتر از زیرساخت قبلی Git Mirrorها و Checkoutهایی که تا دو مرتبه بزرگی سریع‌تر شده‌اند.\n\nاما به نظرم مهم‌ترین بخش مقاله، خود Scion نیست؛ بلکه تغییر نگاه به مهندسی نرم‌افزار است.\n۱. شاید دیگر هر Job به یک Checkout کامل نیاز نداشته باشد.\nابزار Scion برای محیطی طراحی شده که Agentها و Jobها تقریباً همیشه آنلاین‌اند. به‌جای اینکه هر کلاینت یک مخزن کامل داشته باشد، بسیاری از عملیات از طریق API و روی سرور انجام می‌شوند؛ فایل‌ها هم فقط در صورت نیاز دریافت می‌شوند.\n\n۲. فرایندهای ساخته‌شده برای انسان‌ها، لزوماً برای Agentها مناسب نیستند.\nوقتی صدها یا هزاران تغییر هم‌زمان تولید می‌شوند، مدل سنتی Merge Queue و انتظار برای اجرای تست‌ها ممکن است دیگر کافی نباشد. Anthropic به سمت تست‌های خودکار قبل از Deploy و بعد از Merge رفته است؛ حتی اگر بعضی تعارض‌ها پس از Merge آشکار شوند.\n\n۳. نقش مهندس حذف نمی‌شود؛ تغییر می‌کند.\nیکی از بخش‌های تأمل‌برانگیز مقاله این است که مهندسان تیم، Claude را در نوشتن کد از خودشان بهتر می‌دانستند؛ اما همچنان مسئول تصمیم‌های معماری، محدودیت‌های سیستم و انتخاب Trade-offها بودند. حتی گاهی مهم‌ترین کارشان این بود که به AI بگویند «نه»؛ چون AI ممکن است راه‌حلی تولید کند که در ظاهر درست است، اما یک محدودیت معماری را نقض می‌کند یا سیستم را بی‌دلیل پیچیده‌تر می‌سازد.\n\n۴. باید Code Review هم تغییر کند.\nدر این تیم، تمرکز Review به سمت بررسی Intent و هدف تغییر حرکت کرده، نه صرفاً خواندن تک‌تک خطوط کد. البته این به معنی حذف بررسی دقیق کد نیست؛ بلکه یعنی با افزایش حجم تغییرات، باید توجه انسانی را روی تصمیم‌ها و ریسک‌های مهم‌تر متمرکز کرد.\n\nبه نظرم باید از این مقاله یک نتیجه مهم بگیریم:\nما نمی‌توانیم فقط AI را به فرایند فعلی توسعه نرم‌افزار اضافه کنیم و انتظار داشته باشیم همه‌چیز به همان شکل قبلی کار کند. اگر تولید کد ارزان‌تر و سریع‌تر شود، گلوگاه‌ها به جاهای دیگر منتقل می‌شوند: معماری، تست، Code Review، کنترل دسترسی، زیرساخت و حتی نحوه Merge کردن تغییرات.\nالبته خود Anthropic هم تأکید می‌کند که Scion جایگزین عمومی Git نیست؛ این سیستم برای مقیاس بسیار بزرگی از Monorepoها و Agentها طراحی شده است.\n\nمقاله کامل:\nhttps://www.anthropic.com/engineering/redesigning-source-control',
    tags: ['AI', 'VersionControl', 'CodeReview', 'Anthropic']
  },
  706: {
    title: 'POV',
    excerpt: 'یک POV سرگرم‌کننده؛ وقتی دوستت آن‌قدر نزدیک است که جمله‌اش را از چهره‌اش می‌خوانی.',
    full_content: 'POV:',
    tags: ['Humor', 'Personal']
  },
  707: {
    title: 'تنها آهنگ انگیزشی‌ای که می‌شناسم',
    excerpt: 'تنها آهنگ انگیزشی‌ای که می‌شناسم این شاهکار است؛ تعریف موفقیت: ساختن چیزی که هیچ‌کس دیگری نتوانسته و جنگیدن وقتی همه گفته‌اند رها کن.',
    full_content: 'من کلاً یک آهنگ انگیزشی می‌شناسم و آن هم این شاهکاره:\n\nWhat\'s my definition of success?\nCreating something no one else can\nBeing brave enough to dream big\nGrindin\' when you\'re told to just quit\nGiving more when you got nothin\' left\nIt\'s a person that\'ll take a chance on\nSomething they were told could never happen\nIt\'s a person that can see the bright side through the dark times when there ain\'t one',
    tags: ['Personal', 'Music', 'Motivation']
  },
  708: {
    title: 'آسمان، جاده و قهوه کنار کد',
    excerpt: 'سه قاب از یک روز کاری: اتوبان زیر آسمان صاف، جاده پاییزی هنگام غروب و آیس‌لاته‌ای جلوی مانیتوری که یک Code Review را نشان می‌دهد.',
    full_content: '🤩 🙂‍↕️',
    tags: ['Personal', 'Lifestyle']
  },
  711: {
    title: 'وقتی فرانت‌اند تلگرام را با mimo 2.6 نوشته باشند',
    excerpt: 'پیامی شاعرانه در تلگرام: «زمستون کنار بخاری با این صدا داستان بشنویم»؛ انگار فرانت تلگرام را با mimo 2.6 توسعه داده‌اند!',
    full_content: 'وقتی فرانت تلگرام را با mimo 2.6 توسعه داده باشند:',
    tags: ['Telegram', 'AI', 'Humor']
  },
  712: {
    title: 'تبریک قبولی دوستان در کنکور ارشد',
    excerpt: 'تبریک صمیمانه به همه دوستانی که در کنکور ارشد قبول شده‌اند؛ امیدوارم مسیر تحصیلی‌تان سرتاسر موفقیت و شادی باشد. 🔥❤️',
    full_content: 'یه تبریک حسابی هم به مناسب قبولی همه دوستان در کنکور ارشد؛ امیدوارم سرتاسر موفقیت و شادی باشه 🔥❤️',
    tags: ['Personal', 'Community']
  },
  713: {
    title: 'وقتی مسئله‌های خودت بیدارت نگه می‌دارند',
    excerpt: 'هیچ‌وقت این زاویه از زندگی برنامه‌نویس‌ها را دوست نداشتم؛ ولی وای از وقتی که مسئله‌های خودت بیدارت نگه می‌دارند.',
    full_content: 'هیچ‌وقت این زاویه از زندگی برنامه‌نویس‌ها را دوست نداشتم؛ ولی وای از وقتی که مسئله‌های خودت بیدارت نگه می‌دارند.',
    tags: ['DeveloperLife', 'Debugging']
  },
  715: {
    title: 'چالش‌های توسعه سیستم‌های مبتنی بر معماری چندعاملی (Agentic)',
    excerpt: 'ساختن ایجنتی که به‌تنهایی درست کار کند تضمین‌کننده موفقیتش در سناریوهای چندایجنتی نیست؛ هماهنگی خروجی‌ها و مدیریت وضعیت، مسئله اصلی است.',
    full_content: 'این چند وقت شدیداً درگیر چالش‌های جالب توسعه محصولات مبتنی بر معماری Agentic هستم.\n\nیک نکته جالب این است که:\nساختن Agentای که به‌تنهایی درست کار کند، لزوماً به این معنی نیست که کنار چند Agent دیگر هم درست کار می‌کند.\n\nمشکل این است که خروجی یک Agent و یا حتی یک LLM Call قرار است روی تصمیم چند بخش دیگر (مثل آرتیفکت‌ها و یا حتی Stateهای بعدی سیستم) اثر بگذارد.\n\nاینجا دیگر صرفاً با Prompt Engineering طرف نیستیم؛ بحث‌هایی مثل Context Management، State Consistency، Orchestration و Failure Recovery خیلی مهم می‌شوند.\n\nهمین را می‌بینم که ممکن است تک‌تک Agentها در تست‌های مستقل عملکرد خوبی داشته باشند، ولی کل سیستم در یک سناریوی ساده اما کاربری شکست مفتضحانه‌ای بخورد.\n\nاین همان جایی است که به نظرم مهندسی نرم‌افزار دوباره نقش اصلی خودش را نشان می‌دهد (اگر دقت کنید، همه این Redditorها و لینکدینی‌ها فاز مراسم ختم مهندسی نرم‌افزار گرفته‌اند 😂)',
    tags: ['AI', 'AgenticSystemDesign', 'SoftwareArchitecture']
  },
  716: {
    title: 'ریشه‌های نرم‌افزار عمیق‌تر از کدنویسی‌اند',
    excerpt: 'نرم‌افزار همیشه ریشه‌هایی عمیق‌تر از چالش‌های صرفاً کدنویسی داشته؛ از منطق و ریاضیات تا فلسفه طراحی سیستم. ابزارها عوض می‌شوند، اصول نه.',
    full_content: 'یک گزاره هست که خیلی بهش رسیده‌ام و می‌خواهم اینجا هم بگذارم؛ عالی می‌شه اگر نظر بدید:\n\nنرم‌افزار همیشه ریشه‌هایی عمیق‌تر از صرفاً چالش‌های کدنویسی (پیاده‌سازی) داشته است؛ از منطق و ریاضیات گرفته تا فلسفه طراحی سیستم‌ها — همه این‌ها به مهارت حل مسئله برمی‌گردند.\n\nابزارها تغییر می‌کنند و تکنولوژی‌ها تکامل پیدا می‌کنند، اما اصول بنیادین مهندسی به این راحتی از بین نمی‌روند.',
    tags: ['SoftwareEngineering', 'Fundamentals', 'ProblemSolving']
  },
  720: {
    title: 'فرصت شغلی React و C# در شرکت بنیان سامانه',
    excerpt: 'برای دوستانی که به React و C# مسلط هستند، فرصت شغلی در شرکت بنیان سامانه (دکتر حسین نوریان) وجود دارد؛ برای جزئیات پیام بدهید.',
    full_content: 'دوستانی که به React و C# مسلط هستند، یک فرصت شغلی در شرکت بنیان سامانه (دکتر حسین نوریان) وجود دارد.\nبرای اطلاعات بیشتر می‌توانید به من پیام بدهید؛ در خدمتتون هستم: @matinAminsabouri',
    tags: ['React', 'CSharp', 'JobOpening']
  },
  721: {
    title: 'اهمیت مهندسی نرم‌افزار در عصر Agentها',
    excerpt: 'با آمدن Agentها اهمیت مهندسی نرم‌افزار نه‌تنها کمتر نشده، بلکه بیشتر هم شده؛ مدل قوی‌تر لزوماً یعنی سیستم قابل‌اعتمادتر.',
    full_content: 'کامنتی عالی از آقای نقوی 🤝\n\nکاملاً موافقم؛ اتفاقاً به نظر من با آمدن Agentها اهمیت مهندسی نرم‌افزار نه‌تنها کمتر نشده، بلکه در جاهایی بیشتر هم شده. اشتباه رایج این است که فکر کنیم با قوی‌تر شدن مدل‌ها، پیچیدگی‌های مهندسی سیستم خودبه‌خود حل می‌شود؛ در حالی که مدل قوی‌تر لزوماً به معنی سیستم قابل‌اعتمادتر نیست. در نهایت ابزارها و تکنولوژی‌ها تغییر می‌کنند، ولی اصول مهندسی و حل مسئله تغییر نمی‌کند؛ شاید فقط شکل مسئله عوض شده، نه خود مسئله.',
    tags: ['AI', 'SoftwareEngineering', 'AgenticSystemDesign']
  },
  722: {
    title: 'و بالاخره تمام شد',
    excerpt: 'و بالاخره تمام شد؛ دو قاب از صحنه‌های پایانی سریالی تاریک که پایان یک ماجرای طولانی را نشان می‌دهند.',
    full_content: 'و بالاخره تمام شد ✅',
    tags: ['Personal', 'Silo', 'TVSeries']
  },
  725: {
    title: 'موسیقی متن فصل اول سریال Silo',
    excerpt: 'موسیقی متن فصل اول سریال Silo؛ انتخابی برای شنیدن در حال کار و بازگشت به فضای همان دنیای زیرزمینی.',
    full_content: 'Silo season 1 soundtrack',
    tags: ['Music', 'Soundtrack']
  }
};

/*-----------------------------------*\
  build + validate
\*-----------------------------------*/

const problems = [];
const cards = [];

for (const [idStr, c] of Object.entries(CONTENT)) {
  const id = Number(idStr);
  const post = byId.get(id);
  if (!post) { problems.push(`post ${id} missing from notes.json`); continue; }

  if (!post.date) problems.push(`post ${id} has no date`);
  if (c.excerpt.length > 180) problems.push(`post ${id}: excerpt is ${c.excerpt.length} chars (max 180)`);
  if (!c.tags.length || c.tags.length > 4) problems.push(`post ${id}: tag count ${c.tags.length} outside 2-4`);

  const hasImage = id in MEDIA_ALT;
  if (hasImage && !(post.photos || []).length) problems.push(`post ${id}: expected a photo but notes.json has none`);
  if (!hasImage && (post.photos || []).length) problems.push(`post ${id}: unexpected photo on a media:null card`);

  cards.push({
    id: `tg_${id}`,
    title: c.title,
    excerpt: c.excerpt,
    full_content: c.full_content,
    reading_time: readingTime(c.full_content),
    published_at: {
      iso: post.date ? post.date.replace('.000Z', 'Z') : null,
      display: post.date ? display(post.date) : null
    },
    channel: {
      name: 'Khan Academy',
      handle: 'KhanAcademyy',
      post_url: `https://t.me/KhanAcademyy/${id}`
    },
    media: hasImage
      ? { type: 'image', url: post.photos[0], alt: MEDIA_ALT[id], aspect_ratio: '16:9' }
      : null,
    tags: c.tags
  });
}

for (const p of notes.posts) {
  if (!CONTENT[p.id]) problems.push(`notes.json post ${p.id} has no authored card`);
}

const extraPhotos = notes.posts
  .filter((p) => (p.photos || []).length > 1)
  .map((p) => `${p.id}: ${(p.photos || []).length} photos`);

const payload = {
  source: 'telegram',
  generated: new Date().toISOString(),
  channel: { name: 'Khan Academy', handle: 'KhanAcademyy' },
  cards: cards.sort((a, b) => (b.published_at.iso || '').localeCompare(a.published_at.iso || ''))
};

if (problems.length) {
  console.error('VALIDATION FAILED:');
  for (const p of problems) console.error(' - ' + p);
  process.exit(1);
}

await fs.writeFile('assets/data/notes.cards.json', JSON.stringify(payload, null, 2) + '\n');
console.log(`wrote ${cards.length} cards to assets/data/notes.cards.json`);
console.log(`album posts with extra photos (card shows the first): ${extraPhotos.join(', ') || 'none'}`);
for (const c of cards) console.log(`${c.id}  ${c.reading_time}  excerpt=${c.excerpt.length}ch  "${c.title}"`);
