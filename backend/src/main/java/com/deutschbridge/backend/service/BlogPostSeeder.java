package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.entity.BlogPost;
import com.deutschbridge.backend.model.enums.BlogPostStatus;
import com.deutschbridge.backend.repository.BlogPostRepository;
import org.slf4j.Logger;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/** Seeds starter blog posts at startup - any sample whose slug doesn't exist yet - so the home page and /blog aren't bare. */
@Component
public class BlogPostSeeder {

    private final Logger log;

    public BlogPostSeeder(Logger log) {
        this.log = log;
    }

    private record Sample(String title, String slug, String category, String excerpt, String content, int daysAgo) {
    }

    private static final List<Sample> SAMPLES = List.of(
            new Sample(
                    "5 Common Mistakes German Learners Make (and How to Fix Them)",
                    "5-common-mistakes-german-learners-make",
                    "Grammar",
                    "From der/die/das to word order: the five slip-ups we see most often, and a simple fix for each one.",
                    """
                    Learning German is a marathon, not a sprint. Almost every learner stumbles over the same few things — the good news is that each one has a simple fix.

                    ## 1. Learning nouns without their article

                    *Der Tisch*, *die Lampe*, *das Buch* — the article is part of the word. Learn them together, every time, and say them out loud.

                    > A noun without its article is only half a word.

                    **Try this:** colour-code your flashcards — blue for *der*, red for *die*, green for *das*.

                    ## 2. Forgetting verb-second word order

                    In a main clause the conjugated verb always sits in **second position**, no matter what comes first:

                    - Ich lerne heute Deutsch.
                    - Heute **lerne** ich Deutsch.
                    - Jeden Abend **lerne** ich zehn neue Wörter.

                    ## 3. Putting the verb in the wrong place in subclauses

                    After words like *weil*, *dass* and *wenn*, the verb jumps to the **end**:

                    | Main clause | Subclause |
                    |---|---|
                    | Ich bin müde. | ..., weil ich müde **bin**. |
                    | Er lernt Deutsch. | ..., dass er Deutsch **lernt**. |

                    ## 4. Translating word for word

                    Many phrases don't translate literally. *Ich bin 25* means "I am 25 **years old**" — and "Ich habe Hunger" is "I have hunger", not "I am hungry". Learn phrases, not just words.

                    ## 5. Skipping speaking practice

                    Reading and listening feel safe, but fluency comes from speaking. Even five minutes a day of talking to yourself, a tutor or an AI partner makes a real difference.

                    ---

                    Pick **one** of these this week and work on it. Small, consistent fixes beat big, short-lived efforts. Viel Erfolg!
                    """,
                    14),
            new Sample(
                    "How to Build a Daily German Habit That Actually Sticks",
                    "build-a-daily-german-habit",
                    "Study Tips",
                    "Motivation fades; habits don't. Here is a realistic routine you can keep even on your busiest days.",
                    """
                    The learners who succeed aren't the most talented — they're the most **consistent**. Here is how to make German a habit instead of a chore.

                    ## Start ridiculously small

                    Ten minutes a day beats a three-hour session once a week. Your brain needs regular, spaced repetition to move words into long-term memory.

                    ## Attach it to something you already do

                    Pick an existing routine and add German right after it:

                    1. Morning coffee → review your daily words
                    2. Commute → listen to a short dialogue
                    3. Before bed → read one short article

                    ## Mix the skills

                    A good week isn't ten days of flashcards. Rotate through:

                    - **Vocabulary** — a few new words every day
                    - **Grammar** — one short lesson, then a quick quiz
                    - **Reading** — a short text at your level
                    - **Speaking or writing** — even a few sentences

                    > Never miss twice. One skipped day is a slip; two is the start of a new habit.

                    ## Track your streak

                    Seeing a streak grow is surprisingly motivating. Celebrate small milestones — your first 7 days, your first 100 words, your first article read without a dictionary.

                    ## Be kind to yourself

                    You will have off days. Do the **minimum version** — one flashcard set — and move on. Keeping the habit alive matters more than a perfect session.
                    """,
                    9),
            new Sample(
                    "A Complete Guide to Passing Your Goethe B1 Exam",
                    "complete-guide-goethe-b1-exam",
                    "Exam Prep",
                    "What the four modules test, how much time you get, and a practical 8-week plan to walk in confident.",
                    """
                    The Goethe-Zertifikat B1 proves you can handle everyday situations in German. It has four modules, and you need to pass **each** one.

                    ## The four modules

                    | Module | What it tests | Approx. time |
                    |---|---|---|
                    | Lesen | Reading texts, ads and emails | 65 min |
                    | Hören | Listening to announcements and conversations | 40 min |
                    | Schreiben | An informal email and a forum post | 60 min |
                    | Sprechen | A presentation and a joint planning task | 15 min |

                    ## An 8-week plan

                    ### Weeks 1–2: Find your gaps
                    Take a full practice test. Note where you lose points — don't just look at the total score.

                    ### Weeks 3–5: Train each module
                    - **Lesen:** practise skimming for the answer instead of reading every word
                    - **Hören:** listen twice, and read the questions *before* the audio starts
                    - **Schreiben:** memorise useful phrases for openings, requests and closings

                    ### Weeks 6–7: Practise under real conditions
                    Use a timer. Time pressure is often the biggest difference between practice and the real exam.

                    ### Week 8: Polish and rest
                    Review your mistakes, then sleep well. Cramming the night before rarely helps.

                    ## Exam-day tips

                    - Answer **every** question — there is no penalty for guessing
                    - In writing, cover **all** the bullet points in the task
                    - In speaking, a calm, simple sentence beats a complicated one with mistakes

                    You've got this — gute Vorbereitung ist der halbe Erfolg!
                    """,
                    4),
            new Sample(
                    "Why Reading Beats Flashcards for Building Vocabulary",
                    "why-reading-beats-flashcards",
                    "Study Tips",
                    "Words learned in context stick far better than isolated lists. Here is how to read your way to a bigger vocabulary.",
                    """
                    Flashcards are useful, but words you meet **in context** are remembered longer and used more naturally. Reading gives you that context for free.

                    ## What context gives you

                    - **Meaning** — the surrounding sentence hints at what a word means
                    - **Grammar** — you see which case, preposition or word order goes with it
                    - **Repetition** — common words keep returning, which strengthens memory

                    ## How to read effectively

                    1. Choose a text at **your level** — about 90–95% of the words should be familiar
                    2. Read the whole thing once without stopping
                    3. Pick **5–10** useful words and look them up
                    4. Reread, then review those words the next day

                    > Don't look up every unknown word. Focus on the ones you keep seeing.

                    ## Combine both methods

                    The best approach isn't reading *or* flashcards — it's reading **and** flashcards. Save the words you discover while reading, then review them with spaced repetition.

                    Start with short, simple articles and build up. In a few weeks you'll notice you understand far more than before.
                    """,
                    1)
            ,
            new Sample(
                    "How to Learn German Effectively",
                    "how-to-learn-german-effectively",
                    "Study Tips",
                    "A practical, step-by-step approach to learning German faster: what to study, in what order, and how to stay consistent.",
                    """
                    German has a reputation for being hard, but it is also very **logical**. With the right plan, you can make steady progress without burning out.

                    ## 1. Set a clear goal

                    "Learn German" is too vague. Pick something specific and dated:

                    - Pass the **telc B1** exam in 6 months
                    - Hold a 10-minute conversation by summer
                    - Read a news article without a dictionary

                    A clear goal tells you what to practise — and what you can safely ignore for now.

                    ## 2. Build your foundation in the right order

                    1. **Pronunciation and the alphabet** — German is mostly phonetic, so this pays off immediately
                    2. **The 500 most common words** — they cover a huge share of everyday speech
                    3. **Core grammar** — articles, cases, present tense, word order
                    4. **Everything else** — build outward from there

                    ## 3. Learn words with their article and an example

                    Never study *Tisch* on its own. Learn **der Tisch** — and a short sentence like *Der Tisch ist groß.* The article and context are what you'll need when you speak.

                    ## 4. Use all four skills every week

                    | Skill | Simple daily habit |
                    |---|---|
                    | Listening | One short podcast or dialogue |
                    | Reading | A short article at your level |
                    | Speaking | Say your day out loud for 2 minutes |
                    | Writing | Three sentences in a diary |

                    ## 5. Review with spaced repetition

                    You forget most new information within days unless you review it. Revisit words after 1 day, 3 days, a week, and a month — a good flashcard system does this for you.

                    ## 6. Don't fear mistakes

                    > Every mistake you make out loud is a lesson your brain will remember.

                    Native speakers are usually happy that you try. Speak early, accept corrections, and keep going.

                    ## A simple weekly plan

                    - **Mon / Wed / Fri:** grammar lesson + vocabulary review
                    - **Tue / Thu:** reading and listening
                    - **Weekend:** speaking practice and a short writing task

                    Thirty focused minutes a day will take you much further than a long session once a week. Viel Erfolg!
                    """,
                    20),
            new Sample(
                    "TELC B1 Exam Strategies: How to Score Higher",
                    "telc-b1-exam-strategies",
                    "Exam Prep",
                    "Know the format, manage your time, and use these module-by-module strategies to walk into the telc B1 exam with confidence.",
                    """
                    The **telc Deutsch B1** exam has a written part and an oral part, and you need to pass **both**. Knowing the format and having a plan for each section is half the battle.

                    ## The exam at a glance

                    | Section | What you do | Approx. time |
                    |---|---|---|
                    | Leseverstehen | Read texts, ads and notices; match and answer | 90 min together with Sprachbausteine |
                    | Sprachbausteine | Fill gaps in texts (grammar and vocabulary) | included above |
                    | Hörverstehen | Listen to announcements and conversations | about 30 min |
                    | Schriftlicher Ausdruck | Write a semi-formal or personal letter | about 30 min |
                    | Mündliche Prüfung | Introduce yourself, give a talk, plan something together | about 15 min |

                    To pass, you need at least **60 %** in the written part **and** in the oral part.

                    ## Leseverstehen: read smart, not slow

                    - Read the **task first**, then search the text for the answer
                    - Underline key words (names, numbers, dates) — answers usually paraphrase them
                    - If a question takes more than a minute, mark it and come back

                    ## Sprachbausteine: grammar in context

                    - Read the **whole** sentence before choosing, not only the gap
                    - Check the words *around* the gap: article, preposition, verb ending
                    - Eliminate obviously wrong options first

                    ## Hörverstehen: use the preview time

                    1. Read the questions **before** the audio starts
                    2. Note keywords, then listen for them
                    3. You hear many texts **twice** — use the first listening for the big picture, the second to confirm

                    ## Schriftlicher Ausdruck: structure wins points

                    - Cover **every** bullet point in the task
                    - Use a clear structure: greeting, reason for writing, the points, closing
                    - Match the register: *Sehr geehrte Damen und Herren* (formal) vs. *Liebe Anna* (informal)
                    - Keep sentences simple and correct rather than long and risky

                    ## Mündliche Prüfung: stay calm and keep talking

                    - Prepare a short, flexible introduction about yourself
                    - In the presentation, use clear steps: introduction, your experience, pros and cons, conclusion
                    - In the planning task, make proposals and react to your partner: *Wie wäre es, wenn …?*, *Das finde ich gut, aber …*

                    ## Last-week checklist

                    - Do at least **two** full practice tests under a timer
                    - Review your recurring mistakes, not just your score
                    - Sleep well the night before — cramming rarely helps

                    Practise each section a little every day and the exam will feel familiar. Viel Erfolg!
                    """,
                    16),
            new Sample(
                    "Why You Understand German but Can't Speak It",
                    "understand-german-but-cant-speak",
                    "Study Tips",
                    "It's one of the most common frustrations in language learning. Here is why it happens — and how to turn passive knowledge into active speaking.",
                    """
                    You can read an article and follow a conversation — but when it's your turn to speak, the words disappear. If this sounds familiar, you're not alone, and it's very fixable.

                    ## Why it happens

                    **Understanding and speaking are different skills.** Recognising a word when you see or hear it is much easier than *producing* it from memory, in the right form, in real time.

                    Linguists call this the gap between **passive** and **active** vocabulary. Most learners have a passive vocabulary several times larger than their active one.

                    ### Common causes

                    - You mostly **read and listen**, and rarely speak
                    - You translate in your head from your first language before speaking
                    - You're afraid of making mistakes, so you stay silent
                    - You've learned words in lists, not in **sentences you can reuse**

                    ## How to close the gap

                    ### 1. Speak from day one — even alone

                    Describe what you're doing: *Ich koche Kaffee. Ich trinke ihn am Fenster.* Talking to yourself feels silly and works remarkably well.

                    ### 2. Learn chunks, not single words

                    Instead of *Termin*, learn **ich möchte einen Termin vereinbaren**. Ready-made phrases save you from building grammar from scratch under pressure.

                    ### 3. Shadow native speakers

                    Play a short audio clip and repeat it **right after** the speaker, copying rhythm and intonation. Even five minutes a day trains your mouth and your ear together.

                    ### 4. Use a speaking partner

                    A tutor, a language exchange partner or an AI conversation partner all work. What matters is regular, low-pressure practice.

                    ### 5. Accept imperfect German

                    > Fluency is built on thousands of imperfect sentences.

                    Aim to be **understood**, not perfect. You'll improve far faster by speaking with mistakes than by waiting until you feel ready.

                    ## A 10-minute daily routine

                    1. Review 5 useful phrases (2 min)
                    2. Shadow one short audio clip (3 min)
                    3. Answer one question out loud, e.g. *Was hast du heute gemacht?* (3 min)
                    4. Record yourself and listen back (2 min)

                    Do this for a month and the words will start to come when you need them.
                    """,
                    11),
            new Sample(
                    "30 Useful German Expressions for Everyday Life",
                    "30-useful-german-expressions",
                    "Vocabulary",
                    "Thirty natural phrases for greetings, shopping, getting around and small talk — with what they mean and when to use them.",
                    """
                    Knowing a few natural expressions makes you sound much more confident than knowing hundreds of isolated words. Here are **30** you can use right away.

                    ## Greetings and politeness

                    | German | Meaning |
                    |---|---|
                    | **Guten Morgen / Guten Tag / Guten Abend** | Good morning / day / evening |
                    | **Wie geht's?** | How are you? |
                    | **Danke, gut. Und dir?** | Fine, thanks. And you? |
                    | **Freut mich!** | Nice to meet you! |
                    | **Entschuldigung** | Excuse me / sorry |
                    | **Kein Problem** | No problem |
                    | **Gern geschehen** | You're welcome |
                    | **Bis später! / Tschüss!** | See you later! / Bye! |

                    ## When you don't understand

                    | German | Meaning |
                    |---|---|
                    | **Wie bitte?** | Pardon? |
                    | **Können Sie das bitte wiederholen?** | Could you repeat that? |
                    | **Könnten Sie langsamer sprechen?** | Could you speak more slowly? |
                    | **Ich verstehe nicht.** | I don't understand. |
                    | **Was bedeutet … ?** | What does … mean? |
                    | **Wie sagt man … auf Deutsch?** | How do you say … in German? |

                    ## Shopping and eating out

                    | German | Meaning |
                    |---|---|
                    | **Was kostet das?** | How much is this? |
                    | **Ich hätte gern …** | I would like … |
                    | **Ich nehme das.** | I'll take it. |
                    | **Kann ich mit Karte bezahlen?** | Can I pay by card? |
                    | **Die Rechnung, bitte.** | The bill, please. |
                    | **Stimmt so.** | Keep the change. |

                    ## Getting around

                    | German | Meaning |
                    |---|---|
                    | **Wo ist … ?** | Where is … ? |
                    | **Wie komme ich zum Bahnhof?** | How do I get to the station? |
                    | **Geradeaus, dann links** | Straight ahead, then left |
                    | **Von welchem Gleis fährt der Zug?** | Which platform does the train leave from? |
                    | **Eine Fahrkarte nach Berlin, bitte.** | A ticket to Berlin, please. |

                    ## Small talk and everyday phrases

                    | German | Meaning |
                    |---|---|
                    | **Woher kommen Sie?** | Where are you from? |
                    | **Ich lerne seit einem Jahr Deutsch.** | I've been learning German for a year. |
                    | **Das ist mir egal.** | I don't mind. |
                    | **Das macht Spaß!** | That's fun! |
                    | **Genau!** | Exactly! |
                    | **Alles klar!** | All good! / Understood! |
                    | **Viel Glück!** | Good luck! |

                    ## How to actually remember them

                    1. Pick **five** a day, not all thirty at once
                    2. Say each one out loud in a real situation (even imagined)
                    3. Review them again after a day and after a week

                    > Phrases stick when you *use* them. Try to work one new expression into a conversation today.
                    """,
                    7),
            new Sample(
                    "15 Common German Mistakes (and How to Avoid Them)",
                    "15-common-german-mistakes",
                    "Grammar",
                    "Fifteen mistakes almost every German learner makes — with the wrong version, the right version, and a quick rule to remember.",
                    """
                    Mistakes are a normal part of learning, but knowing the most common ones helps you avoid them early. Here are **15**, each with a quick fix.

                    ## Articles and nouns

                    ### 1. Guessing the gender

                    Learn every noun with its article: **der** Tisch, **die** Lampe, **das** Buch. Endings like *-ung*, *-heit*, *-keit* are almost always **die**.

                    ### 2. Forgetting to capitalise nouns

                    ❌ ich habe einen hund · ✅ Ich habe einen **Hund**. All German nouns start with a capital letter.

                    ### 3. Wrong plural

                    German plurals vary a lot: *das Kind → die Kinder*, *der Apfel → die Äpfel*. Learn the plural together with the noun.

                    ## Cases

                    ### 4. Mixing up accusative and dative

                    ❌ Ich gehe in der Schule. · ✅ Ich gehe in **die** Schule. (movement → accusative)
                    ✅ Ich bin in **der** Schule. (location → dative)

                    ### 5. Forgetting the accusative masculine

                    ❌ Ich habe ein Hund. · ✅ Ich habe **einen** Hund.

                    ### 6. Wrong preposition case

                    *mit*, *nach*, *bei*, *von*, *zu*, *aus*, *seit* always take the **dative**: *mit dem Auto*, *nach der Arbeit*.

                    ## Word order

                    ### 7. Verb not in second position

                    ❌ Heute ich gehe ins Kino. · ✅ Heute **gehe** ich ins Kino.

                    ### 8. Verb not at the end in subclauses

                    ❌ Ich weiß, dass er ist müde. · ✅ Ich weiß, dass er müde **ist**.

                    ### 9. Wrong position of *nicht*

                    ✅ Ich verstehe das **nicht**. · ✅ Ich gehe **nicht** nach Hause. Put *nicht* at the end, or before the part you want to negate.

                    ## Verbs

                    ### 10. Forgetting separable verbs

                    ✅ Ich **stehe** um 7 Uhr **auf**. The prefix moves to the end of the sentence.

                    ### 11. Wrong auxiliary in the perfect tense

                    ✅ Ich **habe** gegessen. · ✅ Ich **bin** gegangen. Verbs of movement and change of state usually take *sein*.

                    ### 12. Translating "I am … years old" literally

                    ❌ Ich bin 25 Jahre. · ✅ Ich bin 25 Jahre **alt**.

                    ## Vocabulary and false friends

                    ### 13. *bekommen* ≠ "become"

                    *Ich bekomme ein Geschenk* means "I **get** a present". "To become" is *werden*.

                    ### 14. Confusing *kennen* and *wissen*

                    *Ich **kenne** ihn.* (I know him — I'm acquainted with him) · *Ich **weiß**, dass er kommt.* (I know a fact)

                    ### 15. Mixing up *Sie* and *du*

                    Use **Sie** with strangers, in formal situations and at work. Use **du** with friends, family and children — unless invited otherwise.

                    ## How to fix your own mistakes

                    1. Keep a **mistake notebook** with the wrong and the right version
                    2. Review it once a week
                    3. Pick **one** mistake per week and watch for it in everything you write or say

                    > You don't need to fix everything at once. Fix one thing at a time.
                    """,
                    2)
    );

    /** Starter cover illustrations bundled with the frontend (public/blog-covers). */
    private static String coverFor(String slug) {
        return "/blog-covers/" + slug + ".svg";
    }

    @Bean
    public CommandLineRunner seedBlogPosts(BlogPostRepository repository) {
        return args -> {
            LocalDateTime now = LocalDateTime.now();
            int seeded = 0;
            for (Sample sample : SAMPLES) {
                var existing = repository.findBySlug(sample.slug());
                if (existing.isPresent()) {
                    BlogPost current = existing.get();
                    if (current.getImageUrl() == null && coverFor(sample.slug()) != null) {
                        current.setImageUrl(coverFor(sample.slug()));
                        repository.save(current);
                    }
                    continue;
                }

                BlogPost post = new BlogPost();
                post.setTitle(sample.title());
                post.setSlug(sample.slug());
                post.setCategory(sample.category());
                post.setExcerpt(sample.excerpt());
                post.setContent(sample.content().strip());
                post.setAuthorName("DeutschBridge Team");
                post.setImageUrl(coverFor(sample.slug()));
                post.setStatus(BlogPostStatus.PUBLISHED);
                post.setPublishedAt(now.minusDays(sample.daysAgo()));
                repository.save(post);
                seeded++;
            }
            if (seeded > 0) log.info("Seeded {} blog posts!", seeded);
        };
    }
}
