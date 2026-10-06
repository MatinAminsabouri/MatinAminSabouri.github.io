'use strict';

/*-----------------------------------*\
  data.js — SINGLE SOURCE OF TRUTH
  All site copy lives here. index.html carries structure only (empty
  text nodes + data-i18n keys); script.js renders from this object.

  - i18n   : plain UI chrome strings (buttons, headers, aria labels)
  - the rest: content entities with per-language fields { en, fa }.
             A field may also be a plain string when it is identical
             in both languages (e.g. date periods, tech names).

  TRUST BOUNDARY: every string below is author-written static content.
  script.js renders these with innerHTML — never route remote or
  model-generated text through here without escaping first.
\*-----------------------------------*/

window.SITE_DATA = {

  /*-----------------------------------*\
    UI chrome strings (EN / FA)
  \*-----------------------------------*/
  i18n: {

    en: {
      meta_title: "Matin AminSabouri — AI & Backend Engineer (dotnet / AI Systems)",
      a_prefs: "Preferences",
      a_theme: "Toggle theme",
      a_lang: "Language",
      a_contacts: "Show or hide contact details",
      a_copy_email: "Copy email address",
      a_nav: "Primary",
      a_filter: "Filter projects by category",
      positioning: "AI & Backend Systems Engineer building production-grade distributed backends, RAG pipelines, and on-premise AI deployments under real-world infrastructure constraints.",
      tagline: "AI & Backend Engineer (dotnet / AI Systems)",
      open_to_work: "Busy with learning and building",
      show_contacts: "Show Contacts",
      copy_done: "Copied!",
      nav_about: "About",
      nav_resume: "Resume",
      nav_portfolio: "Portfolio",
      nav_logs: "Notes",
      about_title: "About me",
      doing_title: "What I'm Doing",
      resume_title: "Resume",
      view_resume: "View Resume",
      download: "Download",
      edu_title: "Education",
      exp_title: "Experience",
      skills_title: "Tech Stack",
      portfolio_title: "Portfolio",
      view_github: "View on GitHub",
      case_read_more: "View Case Study",
      case_show_less: "Show Less",
      logs_title: "Notes",
      logs_sub: "Real-world architectural notes, system design trade-offs, and on-premise AI deployment insights directly synced from <a href=\"https://t.me/KhanAcademyy\" target=\"_blank\" rel=\"noopener noreferrer\">@KhanAcademyy</a>.",
      logs_read: "Read on Telegram",
      logs_subscribe: "Subscribe on Telegram",
      logs_empty: "No notes yet — subscribe to catch the next one."
    },

    fa: {
      meta_title: "متین امین صبوری — مهندس هوش مصنوعی و بک‌اند (dotnet / سیستم‌های هوش مصنوعی)",
      a_prefs: "تنظیمات",
      a_theme: "تغییر پوسته",
      a_lang: "زبان",
      a_contacts: "نمایش یا مخفی کردن اطلاعات تماس",
      a_copy_email: "کپی آدرس ایمیل",
      a_nav: "ناوبری اصلی",
      a_filter: "فیلتر پروژه‌ها بر اساس دسته",
      positioning: "مهندس سیستم‌های هوش مصنوعی و بک‌اند؛ سازندهٔ بک‌اندهای توزیع‌شدهٔ تولیدی، پایپلاین‌های RAG و استقرارهای On-Premise هوش مصنوعی در محدودیت‌های زیرساخت واقعی.",
      tagline: "مهندس هوش مصنوعی و بک‌اند (dotnet / سیستم‌های هوش مصنوعی)",
      open_to_work: "مشغول یادگیری و ساختن",
      show_contacts: "نمایش اطلاعات تماس",
      copy_done: "کپی شد!",
      nav_about: "دربارهٔ من",
      nav_resume: "رزومه",
      nav_portfolio: "نمونه‌کارها",
      nav_logs: "یادداشت‌ها",
      about_title: "دربارهٔ من",
      doing_title: "حوزه‌های تخصصی من",
      resume_title: "رزومه",
      view_resume: "مشاهدهٔ رزومه",
      download: "دانلود",
      edu_title: "تحصیلات",
      exp_title: "تجربهٔ کاری",
      skills_title: "پشتهٔ فناوری",
      portfolio_title: "نمونه‌کارها",
      view_github: "مشاهده در گیت‌هاب",
      case_read_more: "مشاهدهٔ مطالعهٔ موردی",
      case_show_less: "نمایش کمتر",
      logs_title: "یادداشت‌ها",
      logs_sub: "نکته‌های واقعی معماری، مصالحه‌های طراحی سیستم و بینش‌های استقرار هوش مصنوعی On-Premise — مستقیماً از <a href=\"https://t.me/KhanAcademyy\" target=\"_blank\" rel=\"noopener noreferrer\">@KhanAcademyy</a> همگام‌سازی شده.",
      logs_read: "مطالعه در تلگرام",
      logs_subscribe: "عضویت در تلگرام",
      logs_empty: "هنوز یادداشتی منتشر نشده — برای مطالعهٔ یادداشت‌های بعدی عضو شوید."
    }

  },

  /*-----------------------------------*\
    Sidebar — contacts & social links
  \*-----------------------------------*/
  profile: {

    contacts: [
      {
        icon: "logo-github",
        label: { en: "GitHub", fa: "گیت‌هاب" },
        href: "https://github.com/MatinAminsabouri",
        text: "matinaminsabouri"
      },
      {
        icon: "mail-outline",
        label: { en: "Email", fa: "ایمیل" },
        href: "mailto:matinaminsabouri70@gmail.com",
        text: "matinaminsabouri70@gmail.com",
        copy: "matinaminsabouri70@gmail.com"
      },
      {
        icon: "logo-linkedin",
        label: { en: "LinkedIn", fa: "لینکدین" },
        href: "https://www.linkedin.com/in/matin-amin-sabouri-b0a6b2200/",
        text: "linkedin.com/in/matin-amin-sabouri"
      },
      {
        icon: "location-outline",
        label: { en: "Location", fa: "موقعیت مکانی" },
        address: { en: "Esfahan, Iran", fa: "اصفهان، ایران" }
      }
    ],

    socials: [
      {
        icon: "logo-github",
        href: "https://github.com/MatinAminsabouri",
        label: { en: "GitHub profile", fa: "پروفایل گیت‌هاب" }
      },
      {
        icon: "logo-linkedin",
        href: "https://www.linkedin.com/in/matin-amin-sabouri-b0a6b2200/",
        label: { en: "LinkedIn profile", fa: "پروفایل لینکدین" }
      }
    ]

  },

  /*-----------------------------------*\
    About tab
  \*-----------------------------------*/
  about: {

    bio: [
      {
        en: "Software Engineer with 3+ years of experience designing and implementing intelligent systems, scalable web backends, and municipal/enterprise automation. Specialized in <strong>dotnet Core</strong> and <strong>Python</strong>, with a strong focus on RAG (Retrieval-Augmented Generation) architectures, AI Agents & MCP workflows, local ASR (Speech Recognition), and Persian NLP.",
        fa: "مهندس نرم‌افزار با بیش از ۳ سال تجربه در طراحی و پیاده‌سازی سیستم‌های هوشمند، بک‌اندهای وب مقیاس‌پذیر و اتوماسیون شهری/سازمانی؛ متخصص در <strong>dotnet Core</strong> و <strong>پایتون</strong> با تمرکز ویژه بر معماری‌های RAG (تولید افزوده با بازیابی)، عوامل هوش مصنوعی و جریان‌های کاری MCP، تشخیص گفتار محلی (ASR) و پردازش زبان فارسی."
      },
      {
        en: "Technical Lead for <strong>'Ravin'</strong> — the first specialized municipal and urban-planning AI assistant in Iran, deployed fully on-premise.",
        fa: "راهبر فنی پروژهٔ <strong>«Ravin»</strong> — نخستین دستیار هوش مصنوعی تخصصی امور شهری و شهرسازی ایران — با استقرار کاملاً On-Premise."
      }
    ],

    stats: [
      { value: "3+",   label: { en: "Years of Experience",     fa: "سال تجربه" } },
      { value: { en: "AI Lead", fa: "راهبر هوش مصنوعی" }, label: { en: "Ravin AI Assistant", fa: "دستیار هوش مصنوعی Ravin" } },
      { value: "100%", label: { en: "On-Premise Deployments",  fa: "استقرارهای On-Premise" } }
    ],

    services: [
      {
        icon: "sparkles-outline",
        title: { en: "AI Systems & RAG Pipelines", fa: "سیستم‌های هوش مصنوعی و پایپلاین‌های RAG" },
        text: {
          en: "Designing deterministic RAG workflows, vector search, custom knowledge bases, and agentic integrations (MCP).",
          fa: "طراحی جریان‌های کاری RAG قطعی، جستجوی برداری، پایگاه‌های دانش سفارشی و یکپارچه‌سازی عوامل (MCP)."
        }
      },
      {
        icon: "server-outline",
        title: { en: "Scalable Backend Architecture", fa: "معماری بک‌اند مقیاس‌پذیر" },
        text: {
          en: "Building resilient RESTful APIs, distributed microservices, and database schemas with dotnet Core, Python, SQL Server, and MongoDB.",
          fa: "ساخت APIهای REST پایدار، میکروسرویس‌های توزیع‌شده و طراحی اسکیماهای داده با dotnet Core، پایتون، SQL Server و MongoDB."
        }
      },
      {
        icon: "mic-outline",
        title: { en: "Speech & Persian NLP (ASR)", fa: "تشخیص گفتار و پردازش زبان فارسی (ASR)" },
        text: {
          en: "Deploying on-premise Sherpa/Gyro ASR engines and NLP models tailored for complex Persian administrative domains.",
          fa: "استقرار موتورهای ASR محلی Sherpa/Gyro و مدل‌های NLP متناسب با حوزه‌های اداری پیچیدهٔ فارسی."
        }
      },
      {
        icon: "shield-checkmark-outline",
        title: { en: "Identity & Access Management (IAM)", fa: "مدیریت هویت و دسترسی (IAM)" },
        text: {
          en: "Designing and implementing IDP & SSO systems with OAuth2, OpenID Connect, Keycloak, IdentityServer4, and OpenIddict.",
          fa: "طراحی و پیاده‌سازی سیستم‌های IDP و SSO با OAuth2، OpenID Connect، Keycloak، IdentityServer4 و OpenIddict."
        }
      }
    ]

  },

  /*-----------------------------------*\
    Resume tab
  \*-----------------------------------*/
  resume: {

    education: [
      {
        title: { en: "Isfahan University Of Technology", fa: "دانشگاه صنعتی اصفهان" },
        period: "2022 — Present",
        desc: { en: "Studying Computer Engineering", fa: "دانشجوی مهندسی کامپیوتر" }
      },
      {
        title: { en: "Harati High school", fa: "دبیرستان هراتی" },
        period: "2019 — 2022",
        desc: { en: "Studied Mathematics in Harati high school", fa: "تحصیل در رشتهٔ ریاضی فیزیک — دبیرستان هراتی" }
      }
    ],

    experience: [
      {
        role: {
          en: "Senior Backend & AI Engineer | Project Lead (Ravin)",
          fa: "مهندس ارشد بک‌اند و هوش مصنوعی | راهبر پروژه (Ravin)"
        },
        period: "Nov 2023 — Present",
        company: {
          en: "Nosaz Mohaseb Safahan — Municipal Automation Systems",
          fa: "نوساز محاسب صفاهان — سامانه‌های اتوماسیون شهری"
        },
        bullets: [
          {
            en: "Architected and led the development of <strong>Ravin AI Assistant</strong> for municipal and urban planning workflows.",
            fa: "معماری و رهبری توسعهٔ <strong>دستیار هوش مصنوعی Ravin</strong> برای جریان‌های کاری شهری و شهرسازی."
          },
          {
            en: "Engineered zero-hallucination RAG pipelines with semantic search across extensive municipal regulations.",
            fa: "طراحی پایپلاین‌های RAG بدون توهم با جستجوی معنایی در گسترهٔ مقررات شهری."
          },
          {
            en: "Integrated local real-time ASR (Sherpa/Gyro) for Persian speech recognition in noisy office environments.",
            fa: "یکپارچه‌سازی ASR بلادرنگ محلی (Sherpa/Gyro) برای تشخیص گفتار فارسی در محیط‌های اداری پرسر و صدا."
          },
          {
            en: "Orchestrated fully on-premise (air-gapped) deployments ensuring data privacy and zero cloud dependency.",
            fa: "مدیریت استقرارهای کاملاً On-Premise (ایزوله از اینترنت) برای تضمین حریم داده‌ها و وابستگی صفر به ابر."
          },
          {
            en: "Implemented observability and distributed tracing with OpenTelemetry and Grafana.",
            fa: "پیاده‌سازی مشاهده‌پذیری و ردیابی توزیع‌شده با OpenTelemetry و Grafana."
          }
        ]
      }
    ],

    skills: [
      {
        title: { en: "AI / RAG & Agents", fa: "هوش مصنوعی / RAG و عوامل" },
        tags: ["RAG", "AI Agents", "MCP", "Semantic Search", "Vector DBs", "PyTorch", "Persian NLP", "ASR · Sherpa/Gyro"]
      },
      {
        title: { en: "Backend & Distributed Systems", fa: "بک‌اند و سیستم‌های توزیع‌شده" },
        tags: ["C#", "dotnet Core", "ASP.NET Core", "Python", "REST APIs", "Microservices", "Design Patterns"]
      },
      {
        title: { en: "Data & Databases", fa: "داده و پایگاه‌های داده" },
        tags: ["MongoDB", "SQL Server", "Entity Framework", "Data Modeling"]
      },
      {
        title: { en: "DevOps & Observability", fa: "دوآپس و مشاهده‌پذیری" },
        tags: ["Docker", "OpenTelemetry", "Grafana", "Linux", "On-Premise Deployment"]
      },
      {
        title: { en: "Security & Identity (IAM)", fa: "امنیت و هویت (IAM)" },
        tags: ["OAuth2", "OpenID Connect", "Keycloak", "IdentityServer4", "OpenIddict"]
      }
    ]

  },

  /*-----------------------------------*\
    Portfolio tab — categories + projects
  \*-----------------------------------*/
  filters: [
    { value: "all",        label: { en: "All",         fa: "همه" } },
    { value: "ai systems", label: { en: "AI Systems",  fa: "سیستم‌های هوش مصنوعی" } },
    { value: "backend",    label: { en: "Backend",     fa: "بک‌اند" } },
    { value: "desktop",    label: { en: "Desktop",     fa: "دسکتاپ" } }
  ],

  projects: [

    {
      id: "ravin",
      category: "ai systems",
      featured: true,
      badges: [
        { tone: "warn", label: { en: "Enterprise",       fa: "سازمانی" } },
        { tone: "info", label: { en: "100% Air-Gapped",  fa: "۱۰۰٪ ایزوله از اینترنت" } }
      ],
      category_label: { en: "AI Systems / RAG", fa: "سیستم‌های هوش مصنوعی / RAG" },
      title: {
        en: "Ravin — On-Premise Municipal AI Assistant",
        fa: "Ravin — دستیار هوش مصنوعی شهری On-Premise"
      },
      desc: {
        en: "The first specialized municipal AI assistant in Iran with Persian NLP, RAG, and Speech-to-Text, deployed entirely on-premise.",
        fa: "نخستین دستیار هوش مصنوعی تخصصی شهری ایران با پردازش زبان فارسی، RAG و تبدیل گفتار به متن؛ با استقرار کاملاً On-Premise."
      },
      tags: ["C#", "Python", "RAG", "ASR", "MongoDB"],
      case_study: {
        id: "ravin-case",
        blocks: [
          {
            type: "text",
            title: { en: "The Challenge & Hard Constraints", fa: "چالش و محدودیت‌های سخت‌گیرانه" },
            html: {
              en: "Municipal inquiries required interpreting complex, localized urban planning regulations with <strong>zero external cloud dependencies</strong>, no internet access (strict air-gapped security), and limited on-premise compute/VRAM.",
              fa: "پاسخ به پرسش‌های شهری مستلزم تفسیر مقررات پیچیده و بومی شهرسازی با <strong>وابستگی صفر به سرویس‌های ابری</strong>، بدون دسترسی به اینترنت (امنیت سخت‌گیرانهٔ ایزوله) و با منابع پردازشی و VRAM محدود On-Premise بود."
            }
          },
          {
            type: "pipeline",
            title: { en: "Engineered Pipeline", fa: "خط لولهٔ مهندسی‌شده" },
            text: "Persian Voice/Text -> Offline ASR (Sherpa) -> Semantic Chunking & Vector Search -> dotnet Orchestrator -> Local LLM + Strict Guardrails"
          },
          {
            type: "decisions",
            title: { en: "Key Architectural Decisions & Evidence", fa: "تصمیم‌های کلیدی معماری و شواهد" },
            items: [
              {
                title: { en: "Decoupled Execution", fa: "اجرای جداسازی‌شده" },
                desc: {
                  en: "dotnet Core handles deterministic business logic & API gateways; Python manages local model inference & embeddings.",
                  fa: "dotnet Core منطق کسب‌وکار قطعی و دروازه‌های API را مدیریت می‌کند و پایتون استنتاج مدل و Embeddingهای محلی را بر عهده دارد."
                }
              },
              {
                title: { en: "Zero-Hallucination RAG", fa: "RAG بدون توهم" },
                desc: {
                  en: "Hybrid retrieval combining exact rule matching with dense vector embeddings stored in on-premise storage.",
                  fa: "بازیابی ترکیبی از تطبیق دقیق قواعد و بردارهای متراکم ذخیره‌شده در فضای ذخیره‌سازی On-Premise."
                }
              },
              {
                title: { en: "Resilient Audio Processing", fa: "پردازش مقاوم صوتی" },
                desc: {
                  en: "Low-latency streaming ASR tuned for noisy administrative environments.",
                  fa: "ASR جریانی با تأخیر کم، تنظیم‌شده برای محیط‌های اداری پر سر و صدا."
                }
              }
            ]
          }
        ]
      }
    },

    {
      id: "leave",
      category: "backend",
      badges: [
        { tone: "ok", label: { en: "Open Source", fa: "متن‌باز" } }
      ],
      category_label: { en: "Backend · Web Application", fa: "بک‌اند · برنامهٔ وب" },
      title: { en: "Leave Management System", fa: "سامانهٔ مدیریت مرخصی" },
      desc: {
        en: "Employee leave management web application built on dotnet Core with MongoDB persistence.",
        fa: "برنامهٔ وب مدیریت مرخصی کارکنان مبتنی بر dotnet Core با ذخیره‌سازی MongoDB."
      },
      tags: ["dotnet Core", "C#", "MongoDB"],
      link: "https://github.com/MatinAminsabouri/Leave-Management"
    },

    {
      id: "sib",
      category: "backend",
      badges: [],
      category_label: { en: "Backend · E-Commerce", fa: "بک‌اند · تجارت الکترونیک" },
      title: { en: "SibSalamat Online Pharmacy", fa: "داروخانهٔ آنلاین سیب‌سلمات" },
      desc: {
        en: "Online pharmacy platform built with dotnet 7 and MongoDB as the core persistence layer.",
        fa: "پلتفرم داروخانهٔ آنلاین ساخته‌شده با dotnet 7 و MongoDB به‌عنوان لایهٔ اصلی ذخیره‌سازی."
      },
      tags: ["dotnet 7", "MongoDB"],
      note: { en: "Repository private — available on request", fa: "مخزن خصوصی — در صورت درخواست" }
    },

    {
      id: "iut",
      category: "desktop",
      badges: [
        { tone: "ok", label: { en: "Open Source", fa: "متن‌باز" } }
      ],
      category_label: { en: "Desktop · GUI", fa: "دسکتاپ · رابط گرافیکی" },
      title: { en: "IUT Messenger", fa: "پیام‌رسان IUT" },
      desc: {
        en: "Desktop messenger application built with C++ and Qt 6 — IUT Advanced Programming final project.",
        fa: "برنامهٔ پیام‌رسان دسکتاپ با C++ و Qt 6 — پروژهٔ پایانی برنامه‌نویسی پیشرفتهٔ دانشگاه صنعتی اصفهان."
      },
      tags: ["C++", "Qt 6"],
      link: "https://github.com/MatinAminsabouri/Messenger_sprites_6"
    }

  ],
  /*-----------------------------------*\
    Notes tab — fallback posts
    The live Telegram source for this channel is currently unavailable, so
    a few real posts are kept here (archived via the Wayback Machine) and
    shown instantly on load. If the live feed resolves again, script.js
    replaces these automatically.
  \*-----------------------------------*/

  notes: {

    posts: [
      {
        id: 241,
        date: "2025-07-14T20:40:43Z",
        title: "چرا اول requirements.txt در Dockerfile؟",
        tags: ["Docker", "Dockerfile", "Caching"],
        url: "https://web.archive.org/web/20250807072000/https://t.me/s/khanAcademyy/232",
        text: `امشب یکی از نکات ریز ولی خیلی جالب در داکر بررسی میکنیم. 

گفتیم که هر خط در داکر فایل در واقع به یک لایه نگاشت میشه

اما چیزی که به وفور خواهید دید این هست که همیشه توی داکرفایل ها اول requirements هامون کپی میکنیم

خب چرا تو داکرفایل اول requirements رو کپی می‌کنیم؟ 

ما تو داکرفایل‌ها برای ساخت image اپلیکیشن‌هامون، یه ترفند مهم داریم: اول فایل requirements.txt رو کپی می‌کنیم، بعد پکیج‌ها رو نصب می‌کنیم، و در آخر سورس کد رو کپی می‌کنیم. اما چرا؟ دلیلش برمی‌گرده به کشینگ لایه‌های داکر که باعث می‌شه ساخت ایمیج سریع‌تر و بهینه‌تر بشه! 

چرا این ترتیب مهمه؟ 
بازهم یادآوری میکنم که
داکر هر خط داکرفایل رو به یک لایه (Layer) تبدیل می‌کنه و لایه‌ها رو کش می‌کنه. اگه یه لایه تغییر نکنه، داکر از کش استفاده می‌کنه و دوباره اجراش نمی‌کنه. 
- چرا اول requirements.txt؟ 
 فایل requirements.txt معمولاً کمتر تغییر می‌کنه (مثلاً یه بار Flask رو مشخص می‌کنی). با کپی این فایل و نصب پکیج‌ها، لایه نصب پکیج‌ها کش می‌شه. اگه سورس کدمون تغییر کنه، داکر نیازی به نصب دوباره پکیج‌ها نداره ( اگر هر سری بخواین نصب کنید با اینترنت ایران که نمیشه اصلا راه نداره )
- چرا سورس کد آخر؟ 
 سورس کد ( توی مثال فرضی ما app.py (http://app.py/)) معمولاً زیاد تغییر می‌کنه. اگه اول کپی بشه، هر تغییر کوچیک تو کد، کش لایه‌های بعدی (مثل نصب پکیج‌ها) رو باطل می‌کنه و منطقا ساخت ایمیج کند می‌شه.`
      },
      {
        id: 232,
        date: "2025-07-09T20:00:13Z",
        title: "شبکه‌سازی در داکر و انواع شبکه‌های داکر",
        tags: ["Docker", "Networking"],
        url: "https://web.archive.org/web/20250807210310/https://t.me/s/khanAcademyy/229",
        text: `شبکه سازی در داکر و انواع شبکه‌های داکر
 
 خب همونطور که تا اینجا ما میدونیم تو داکر از کانتینرها برای اجرای اپلیکیشن‌ها استفاده می‌کنیم،

همینطور گفتیم که داکر به ذات ایزولس و کانتینر یعنی یک محیط مستقل و ایزوله

 اما این کانتینرها باید بتونن باهم یا با دنیای بیرون (مثل کاربر یا سرور) هم ارتباط برقرار کنن

 شبکه‌سازی امکان اتصال ایزوله و امن بین کانتینرها، هاست و شبکه‌های خارجی رو برای ما فراهم می‌کنه.

#docker6_1`
      },
      {
        id: 221,
        date: "2025-07-04T20:49:14Z",
        title: "بررسی خط به خط Dockerfile",
        tags: ["Docker", "Dockerfile"],
        url: "https://web.archive.org/web/20250827234949/https://t.me/s/khanAcademyy/211",
        text: `FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .
EXPOSE 5000
CMD ["python", "app.py"]
 بررسی خط به خط 🔍:
FROM python:3.9-slim
ایمیج پایه رو مشخص کردیم
. اینجا از نسخه سبک پایتون ۳.۹ استفاده کردیم که حجمش کمه (حدود ۸۰ مگابایت). 

WORKDIR /app
یه پوشه به اسم /app تو کانتینر میسازیم و دیگه بقیه دستورات رو از اونجا اجرا میکنیم. 

COPY requirements.txt 
فایل requirements.txt از سیستم تو رو کپی میکنیم به پوشه /app تو ایمیج. این فایل لیست پکیج‌های مورد نیاز (مثل Flask) رو داره.

RUN pip install --no-cache-dir -r requirements.txt
پکیج‌های توی requirements.txt رو نصب می‌کنه. گزینه --no-cache-dir فایل‌های موقت نصب رو نگه نمی‌داره تا ایمیج سبک بمونه
COPY app.py (http://app.py/) 
فایل اصلی اپ (app.py (http://app.py/)) رو به پوشه /app تو ایمیج کپی کنیم

EXPOSE 5000
به داکر اعلام میکنیم که اپ ما روی پورت ۵۰۰۰ کار می‌کنه 

CMD ["python", "app.py (http://app.py/)"]
دستور پیش‌فرض برای اجرای کانتینر رو مشخص می‌کنه. 

حالا برای اجرا کردنش میگیم 
docker build -t my-flask-app:1.0 .
docker run -d -p 5000:5000 my-flask-app:1.0

#docker4_3`
      },
      {
        id: 208,
        date: "2025-06-30T21:43:32Z",
        title: "کانتینر چیه؟",
        tags: ["Docker", "Containers"],
        url: "https://web.archive.org/web/20250902023749/https://t.me/s/khanAcademyy/203",
        text: `کانتینر چیه؟
کانتینر یه نمونه اجرا شده از ایمیجه. وقتی می‌زنیم 
docker run python:3.9-slim
 داکر میاد و یه کانتینر می‌سازه که برنامه ما داخل یه محیط ایزوله اجرا می‌شه
خب یه سوال خوبی که پرسیده میشه اینکه فرقش با image چیه؟

اینطور بگم که image مثل یه roadmap، 
و کانتینر یک محصول ساخته‌شده از اون roadmap
.حالا چطور کار می‌کنه؟: داکر یه لایه قابل نوشتن (Writable Layer) به ایمیج اضافه می‌کنه تا تغییرات (مثل لاگ‌ها یا فایل‌های موقت) ذخیره بشن. این لایه به صورت دیفالت با حذف کانتینر پاک می‌شه (مگر اینکه والیوم استفاده کنی که در اینده حسابی راجبش حرف میزنیم).
یک نکته دیگه اینکه کانتینرها میان و از ویژگی لینوکس مثل Namespaces استفاده می‌کنن تا CPU، حافظه و شبکه رو ایزوله کنن. برای همین سبک‌تر از ماشین‌های مجازی (VM) هستن

#Docker2_2`
      },
      {
        id: 197,
        date: "2025-06-28T04:30:19Z",
        title: "معرفی Gemini CLI",
        tags: ["AI", "Gemini CLI"],
        url: "https://web.archive.org/web/20250902023749/https://t.me/s/khanAcademyy/203",
        text: `گوگل همین چند روز پیش از جمنای CLI پرده برداری کرد که خیلیا الان دیگه میتونن ازش در محیط ترمینال استفاده کنند. خیلی کاربردیه مخصوصا برای دولوپرها https://github.com/google-gemini/gemini-cli @DevTwitter |`
      },
      {
        id: 194,
        date: "2025-06-24T20:26:47Z",
        title: "نکته‌ای در پترن Repository",
        tags: ["Architecture", "Repository Pattern"],
        url: "https://web.archive.org/web/20250902023749/https://t.me/s/khanAcademyy/203",
        text: `یک نکته جالبی امروز دیدم خیلی جالب بود :

اینکه توسعه دهنده ها میان متود های پترن Repository رو خیلی تو منطق برنامه به صورت share استفاده میکنن زیادم جالب نیست

مخصوصا وقتی بین ۲۰ تا متود حداقل ۵ تاشون UPDATE میخورن و مثلا ۱۵ تای دیگه GET 

هر کیس باید جداگونه بررسی شه و حدالامکان بهینه ترین و درست ترین پیاده سازی براش کرد حتی اگر حجم کد خیلی زیاد شه 

خیلی این چیزا تو اپدیت ها دست و پا گیره

کلا هر چی فریمورک ها پخته تر میشن و میرن جلو سخت گیر تر میشن روی کار با دیتابیس
پس ORM کلا خیلی مثل قبل دست توسعه دهنده رو باز نمیزاره 
بلکه هدف فقط کارایی خوبه

خیلی خلاصش اینه که لایه Repository اصلا توش کلی گرایی نمیشه کرد یگی خب اینا که همه میرن سراغ این تبیل و این کارو میکنن بزار همشونو یه شکل کنم`
      }
    ],

  },

};
