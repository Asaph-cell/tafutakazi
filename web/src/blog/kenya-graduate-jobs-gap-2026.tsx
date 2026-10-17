import { Link } from 'react-router-dom'
import { Bars, Callout, H2, P, Photo, Ref, Sources, Stat, Stats, type PhotoInfo } from './ui'

const MEETING: PhotoInfo = { id: 'photo-1653566031486-dc4ead13a35d', alt: 'A team working around a table with laptops', by: 'UK Black Tech', user: 'ukblacktech' }
const GRADUATES: PhotoInfo = { id: 'photo-1645262960690-5cb9db42d35a', alt: 'Graduates in gowns posing together in Nairobi', by: 'Oscar Omondi', user: 'xodusdigitals', caption: 'Graduates in Nairobi.' }
const SKYLINE: PhotoInfo = { id: 'photo-1781504842018-c51ce0dac23f', alt: 'Office buildings in Nairobi under a cloudy sky', by: 'Seth Salimo', user: 'thesixthsalimo', caption: 'Nairobi.' }
const LAPTOP: PhotoInfo = { id: 'photo-1573167101669-476636b96cea', alt: 'A young professional working on a laptop in a meeting room', by: 'Christina @ wocintechchat.com', user: 'wocintechchat' }
const DESK: PhotoInfo = { id: 'photo-1632923943917-a1dd60878fa4', alt: 'Two colleagues working together at a desk', by: 'TheStandingDesk', user: 'thestandingdesk' }

const a = (href: string, text: string) => <a href={href} target="_blank" rel="noopener noreferrer">{text}</a>

export default function Post() {
  return (
    <>
      <P>
        In 2024, 286,695 people graduated from Kenya's universities and TVET colleges and went looking for work.<Ref n={1} />{' '}
        That same year, the economy created 75,000 formal jobs.<Ref n={1} /> Even if every one of those jobs had gone to a
        new graduate, about three in four would still have been left without one.
      </P>
      <P>
        For job seekers, that is a crisis. For employers, it is something else as well: the largest pool of educated,
        available young talent Kenya has ever had, and most hiring processes are built to screen it out. This piece
        looks at what the latest data says, where the numbers are heading, and what it means if you hire.
      </P>

      <Photo photo={MEETING} />

      <H2>What the 2026 data shows</H2>
      <P>
        The Kenya National Bureau of Statistics' 2026 Economic Survey, released in April, counted 822,100 new jobs in
        2025.<Ref n={2} /> On the surface that is a good year. Look closer and 716,800 of those jobs, about 87 per cent, were
        in the informal sector: small trade, casual work and self-employment.<Ref n={2} /> Formal jobs, the kind with a
        contract, a payslip and a career path, came to about 105,000.<Ref n={3} />
      </P>
      <Stats>
        <Stat value="822,100" label="new jobs in Kenya in 2025" />
        <Stat value="87%" label="of them in the informal sector" />
        <Stat value="3.3M" label="people in formal wage jobs, up 2.8% in a year" />
      </Stats>
      <P>
        Formal job creation has also been unsteady. It fell from 122,900 in 2023 to 75,000 in 2024, before recovering to
        about 105,000 in 2025.<Ref n={1} /><Ref n={3} /> Total formal wage employment grew by 2.8 per cent, to 3.3 million
        people.<Ref n={2} /> The formal economy is growing, but slowly, and nowhere near the pace at which young people are
        arriving.
      </P>
      <Bars
        max={1000000}
        rows={[
          ['Young people entering the labour market each year (estimate)', 1000000],
          ['Graduates from universities and TVETs (2024)', 286695, true],
          ['Formal jobs created (2025)', 105300],
          ['Formal jobs created (2024)', 75000],
        ]}
        note="Sources: KNBS via Business Daily; KNBS Economic Survey 2026; World Bank estimate as reported. See the list below."
      />

      <H2>A generation waiting in line</H2>
      <Photo photo={GRADUATES} />
      <P>
        Around one million young Kenyans enter the labour market every year, according to World Bank estimates.<Ref n={4} />{' '}
        The International Labour Organization counts 2.83 million young Kenyans who are not in employment, education or
        training. That is the highest number in East Africa, almost double Tanzania's 1.46 million.<Ref n={1} />
      </P>
      <P>
        Graduates are not spared. A study by the Commission for University Education, reported in September 2026, found
        that Kenyan graduates wait an average of 11.6 months for their first job.<Ref n={5} /> Only 25.3 per cent find work
        within six months of graduating, and four in ten wait more than a year.<Ref n={5} />
      </P>
      <Stats>
        <Stat value="11.6" label="months, on average, before a graduate's first job" />
        <Stat value="25.3%" label="of graduates find work within six months" />
        <Stat value="2.83M" label="young Kenyans not in work, education or training" />
      </Stats>

      <H2>What the future looks like</H2>
      <Photo photo={SKYLINE} ratio={16 / 9} />
      <P>
        Kenya is young and getting bigger. The National Council for Population and Development puts the median age at
        about 20.5, with more than three in four Kenyans under 35. It projects a population of 70 million by 2045.<Ref n={6} />{' '}
        The number of young people looking for their first job will keep rising for at least the next two decades.
      </P>
      <P>
        A simple illustration shows the scale. If the next five years look like the last three, with roughly 100,000
        formal jobs a year against about a million new entrants, then between 2026 and 2030 around five million young
        people will compete for about half a million formal jobs. That is roughly one formal job for every ten people
        joining the labour market. This is arithmetic on today's numbers, not a forecast, but it shows the direction.
      </P>
      <Callout>For the next decade, Kenyan employers will not be short of young applicants. They will be short of good ways to choose between them.</Callout>

      <H2>Why the best graduates are being overlooked</H2>
      <Photo photo={LAPTOP} />
      <P>
        Employers name the same problems the graduates do. In the CUE study, graduates ranked lack of work experience as
        the single biggest barrier to employment, ahead of limited openings and skills mismatch.<Ref n={5} /> Employers, for
        their part, reported gaps in problem-solving, critical thinking, communication and time management, the very things
        a CV cannot show.<Ref n={5} />
      </P>
      <P>
        So most companies fall back on the filter that is easiest to apply: "two to three years' experience required." It
        feels safe. The research says it is one of the weakest predictors there is. The most thorough recent review of
        hiring research found that years of experience predicts job performance at 0.07, on a scale where 0 means no link
        and 1 a perfect one. A sample of the person's actual work predicts it at 0.33, far more strongly.<Ref n={7} />
      </P>
      <Bars
        max={0.5}
        rows={[
          ['A sample of their actual work', 0.33, true],
          ['An unstructured interview', 0.19],
          ['Years of experience', 0.07],
        ]}
        note="How well each method predicts job performance (0 = no link, 1 = perfect). Sackett et al., 2022."
      />
      <P>
        The experience filter does more than lose good people. It sends hundreds of near-identical CVs into your inbox,
        hides the sharp, hungry graduate who would have grown with you, and leaves you choosing on paper instead of on
        evidence.
      </P>

      <H2>What this means if you hire</H2>
      <Photo photo={DESK} />
      <P>
        <strong>The talent is there; the signal is not.</strong> With more than a quarter of a million graduates a year,
        your best entry-level hire is almost certainly in the pool. The question is how you find them.
      </P>
      <P>
        <strong>Test for the gaps employers actually complain about.</strong> If your worry is problem-solving and
        communication, a short task, explained in the candidate's own words, shows you both in an afternoon. A CV shows
        neither.
      </P>
      <P>
        <strong>Treat internships and trainee roles as hiring, not charity.</strong> In the CUE study, 70 per cent of
        graduates had done an internship after graduating.<Ref n={5} /> The government and the private sector are now
        putting money behind structured placements: NextGen.KE, launched in 2026 by the Kenya Private Sector Alliance and
        UNDP, aims to place 15,000 pre-screened graduates in paid one-year internships over three years.<Ref n={8} />{' '}
        Companies that build good entry routes now will have first pick.
      </P>
      <P>
        <strong>Hire for what people can show, not how long they have waited.</strong> A graduate who has been job hunting
        for a year has not lost a year of skill. A short, fair work sample tells you who is ready.
      </P>

      <H2>A different way to find your next hire</H2>
      <P>
        This is why we built Tafutakazi. Companies post a short task from a real role, free. Fresh graduates do it,
        explain their work on video and write up how they approached it. You watch the work, score it against what matters
        to you, and invite the people you want to meet. It works for jobs, paid internships and graduate trainee roles.
      </P>
      <P>
        Kenya's job gap will not close in a year. But every company that starts hiring on evidence instead of experience
        closes it a little, and gets better hires for it. <Link to="/hiring">Post your first task for free</Link>.
      </P>

      <Sources items={[
        <>Business Daily, "Kenya's youth joblessness highest in the region", 22 April 2026, reporting KNBS and ILO figures. {a('https://www.businessdailyafrica.com/bd/economy/kenya-s-youth-joblessness-highest-in-the-region-5432820', 'businessdailyafrica.com')}</>,
        <>Kenya National Bureau of Statistics, Economic Survey 2026, as reported by Capital FM, 30 April 2026. {a('https://capitalfm.africa/kenya-adds-882100-jobs-in-2025/', 'capitalfm.africa')} (The article's headline says 882,100; the survey figure is 822,100.)</>,
        <>Eastleigh Voice, "Kenya created 822,000 new jobs in 2025, informal sector leads the rally", reporting the KNBS Economic Survey 2026. {a('https://eastleighvoice.co.ke/business/341864/kenya-created-822000-new-jobs-in-2025-informal-sector-leads-the-rally-knbs', 'eastleighvoice.co.ke')} Reports put 2025 formal jobs at 101,000 to 105,300.</>,
        <>World Bank estimate of young people entering Kenya's labour market each year, as reported by Streamline Feed, October 2025. {a('https://streamlinefeed.co.ke/news/world-bank-warns-of-looming-global-jobs-crisis-kenya-faces-youth-unemployment-challenge', 'streamlinefeed.co.ke')} Earlier World Bank estimates put it at around 800,000.</>,
        <>Commission for University Education, "Employability of Graduates in Kenya: A Study of Perceptions and Expectations of Employers", reported by the Daily Nation, 17 September 2026. {a('https://nation.africa/kenya/news/education/report-why-kenyan-graduates-struggle-to-find-employment-5597362', 'nation.africa')}</>,
        <>National Council for Population and Development, Population Situation Analysis 2025 (launched 18 February 2026), reported by Citizen Digital, 4 March 2026. {a('https://citizen.digital/article/report-warns-of-youth-joblessness-health-strain-as-kenyas-population-nears-60-million-n378433', 'citizen.digital')}</>,
        <>Sackett, P. R., Zhang, C., Berry, C. M., &amp; Lievens, F. (2022). Revisiting meta-analytic estimates of validity in personnel selection. <em>Journal of Applied Psychology</em>, 107(11), 2040–2068. {a('https://doi.org/10.1037/apl0000994', 'doi.org/10.1037/apl0000994')}</>,
        <>The Star, "KEPSA, UNDP launch youth jobs programme in Nairobi", 19 June 2026. {a('https://www.the-star.co.ke/news/2026-06-19-kepsa-undp-launch-youth-jobs-programme-in-nairobi', 'the-star.co.ke')}</>,
      ]} />
    </>
  )
}
