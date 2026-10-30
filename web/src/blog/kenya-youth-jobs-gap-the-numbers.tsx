import { Callout, H2, P, Photo, Sources, Stat, Stats, Table, type PhotoInfo } from './ui'


const YOUTH: PhotoInfo = { id: '/blog/young-people.webp', alt: 'A crowd of young people standing together outdoors', by: 'Tafutakazi', user: '' }

export default function Post() {
  return (
    <>
      <P>
        In the best case, at most 1 in 8 young Kenyans entering the job market each year can land a formal job, and in
        reality far fewer. This post walks through the numbers behind that figure, what happens to everyone else, and why
        the gap keeps growing.
      </P>

      <Stats>
        <Stat value="1 in 8" label="new entrants can land a formal job, at best" />
        <Stat value="87.2%" label="of new jobs in 2025 were informal" />
        <Stat value="7M+" label="young people shut out of formal work over 10 years" />
      </Stats>

      <H2>The scale of the problem</H2>
      <P>
        An estimated 800,000 to 1 million young people enter Kenya's job market every year, according to a 2026 report
        by the African Institute for Development Policy (AFIDEP) and CAP-YEI (Citizen Digital). That is roughly the
        population of a mid-sized county arriving at the labour market's door annually.
      </P>
      <P>The question is simple: how many jobs are waiting for them?</P>

      <H2>Formal jobs: about 100,000 a year</H2>
      <P>
        Kenya created about 105,000 new formal (modern-sector) jobs in 2025, according to the Kenya National Bureau of
        Statistics (KNBS) Economic Survey. This post uses a round 100,000.
      </P>
      <Table
        head={['Year', 'Total new jobs', 'Formal', 'Informal']}
        rows={[
          ['2025', '822,100', '105,300', '716,800'],
        ]}
        note="Source: KNBS Economic Survey, as reported by Business Today. Reports vary slightly."
      />
      <P>
        These jobs are not reserved for young people. Fresh graduates compete for them with experienced, older workers,
        so youths get only a share of the 100,000.
      </P>
      <P>
        How big a share is unknown. No source publishes how many youths are hired into formal jobs each year, because KNBS
        does not report formal hires by age.
      </P>

      <H2>The odds: at best 1 in 8</H2>
      <P>
        Imagine the best possible case: every one of the 100,000 formal jobs goes to a young person, and none to older
        workers. Even then, the odds are small:
      </P>
      <Table
        head={['Youths entering', 'Formal jobs (all to youths)', 'Share who could get one', 'Odds']}
        rows={[
          ['800,000', '100,000', '12.5%', '1 in 8'],
          ['1,000,000', '100,000', '10%', '1 in 10'],
        ]}
      />
      <P>
        In reality, older workers take many of those jobs, so the true odds are lower than 1 in 8. One published figure
        points the same way: just 8.6% of employed Kenyan youth hold formal jobs (The Star). And these odds are for any
        formal job, not one in the field a person studied.
      </P>

      <Photo photo={YOUTH} />

      <H2>Ten years on: at least 7 million shut out of formal work</H2>
      <P>Even in the best case, where youths take all 100,000 formal jobs, the rest must find another path:</P>
      <ul className="m-0 flex flex-col gap-2 pl-5">
        <li><strong className="text-ink">With 800,000 entrants:</strong> 800,000 − 100,000 = 700,000 a year, or about 7 million over 10 years</li>
        <li><strong className="text-ink">With 1 million entrants:</strong> 1,000,000 − 100,000 = 900,000 a year, or about 9 million over 10 years</li>
      </ul>
      <P>
        Because older workers take some formal jobs, the real numbers are higher. These are young people without a formal
        job, not necessarily unemployed. Most will turn to informal work.
      </P>

      <H2>The informal sector absorbs most, but not all</H2>
      <P>
        Kenya creates about 700,000 to 720,000 new informal jobs a year: jua kali, boda boda, hawking, casual labour. In
        2025, informal work made up 716,800 of 822,100 new jobs, or 87.2% (Business Today). Informal jobs have made up
        nearly nine of every 10 new jobs for five years running (The Standard).
      </P>
      <P>
        KNBS does not split informal jobs by age, so the youth share is unknown. Using the best-case 700,000 youths
        without formal jobs and 2025's 716,800 informal jobs:
      </P>
      <Table
        head={['Youth share of informal jobs', 'Youths in informal work', 'Left with no job, per year', 'Over 10 years']}
        rows={[
          ['100% (impossible ceiling)', 'all 700,000', 'about 0', 'about 0'],
          ['50%', 'about 358,000', 'about 342,000', 'about 3.4 million'],
        ]}
      />
      <P>
        The 50% scenario looks closest to reality. A World Data Lab study found that 754,185 Kenyan youth aged 15 to 35
        took up informal work from 2024 to early 2026, roughly 375,000 a year (Business Daily). Against about 710,000 new
        informal jobs a year, that is roughly half. The same study puts youth informality at 91.5%, up from 90.2% two
        years earlier.
      </P>
      <P>
        One point holds regardless. The economy creates about 820,000 jobs a year of every kind, for all ages combined.
        That barely matches the number of young people entering the market alone, before counting older workers or
        youths still waiting from earlier years.
      </P>

      <H2>How many youths are unemployed today? It depends who's counting</H2>
      <P>Estimates of youth unemployment range from about 15% to 67%, because they measure different things:</P>
      <Table
        head={['Estimate', 'Ages', 'What it counts', 'Source']}
        rows={[
          ['15.2% (2025)', '15–24', 'No work at all, actively looking (ILO model)', 'World Bank via FRED'],
          ['Up to 67%', '15–34', 'A broader measure reflecting job scarcity and slow transitions into stable work', 'Federation of Kenya Employers, via The Star'],
        ]}
      />
      <P>
        Part of the problem is data. An ILO official told the Kenya News Agency that Kenya lacks regular labour force
        statistics, making precise assessment hard (Kenya News Agency).
      </P>

      <H2>The bottom line</H2>
      <P>
        Kenya's problem is less a lack of work than a lack of decent work. Nearly every young person who doesn't land a
        formal job ends up in informal work without contracts, benefits or stable pay, or with no job at all.
      </P>
      <P>
        Over the next decade, that adds up to at least 7 million young people shut out of formal employment, even in the
        best case. Closing the gap means creating far more formal jobs, not just more jobs.
      </P>
      <Callout>
        A note on the numbers: the headline figures are best cases. They assume youths take all formal jobs, which they
        don't, and that today's rates hold for 10 years. The real picture is worse.
      </Callout>

      <Sources items={[
        <a href="https://www.businessdailyafrica.com/bd/economy/more-kenyan-youth-join-informal-employment-as-jobs-be-thin-5355064" target="_blank" rel="noopener noreferrer">Business Daily: More Kenyan youth join informal employment as jobs become thin</a>,
        <a href="https://businesstoday.co.ke/?p=154957" target="_blank" rel="noopener noreferrer">Business Today: Ruto at 4, 3.27 Million Jobs Created, Here's The Breakdown</a>,
        <a href="https://www.businessdailyafrica.com/bd/economy/economy-adds-824-000-new-jobs-eases-youth-joblessness-5441196" target="_blank" rel="noopener noreferrer">Business Daily: Economy adds 824,000 new jobs, eases mounting youth joblessness</a>,
        <a href="https://www.standardmedia.co.ke/counties/article/2001546935/mwaura-nine-in-10-new-jobs-created-in-2025-were-informal" target="_blank" rel="noopener noreferrer">The Standard: Nine in 10 new jobs created in 2025 were informal</a>,
        <a href="https://the-star.co.ke/news/2026-02-12-kenya-among-african-states-with-lowest-formal-jobs-for-youth-report" target="_blank" rel="noopener noreferrer">The Star: Kenya among African states with lowest formal jobs for youth</a>,
        <a href="https://fred.stlouisfed.org/series/SLUEM1524ZSKEN" target="_blank" rel="noopener noreferrer">FRED / World Bank: Youth Unemployment Rate for Kenya</a>,
        <a href="https://www.kenyanews.go.ke/?p=179349" target="_blank" rel="noopener noreferrer">Kenya News Agency: ILO calls for stronger policies to tackle youth unemployment</a>,
        <a href="https://citizen.digital/article/about-1-million-youth-enter-labour-market-yearly-over-80-find-informal-jobs-report-n384935" target="_blank" rel="noopener noreferrer">Citizen Digital: About 1 million youth enter labour market yearly, over 80% find informal jobs (AFIDEP report)</a>,
      ]} />
    </>
  )
}
