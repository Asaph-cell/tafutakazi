-- Twelve more practice tasks, for the roles fresh graduates apply for most.
-- Everything a graduate needs is in the instructions. Safe to run twice: skips titles that already exist.

insert into public.tasks (role, title, instructions, minutes_estimate, status)
select v.role, v.title, v.instructions, v.minutes, 'live'
from (values

('Software Developer', 'Stock tracker for a hardware shop',
E'Mwangi Hardware in Kitengela keeps stock in an exercise book. Items run out without anyone noticing, and the owner '
'only finds out when a customer asks.\n\n'
'Build a small web app that lets the shop:\n'
'1. Add items with a name, a buying price, a selling price and how many are in stock.\n'
'2. Record a sale, which reduces stock.\n'
'3. See items that are running low (5 or fewer) at the top.\n'
'4. See today''s sales total and profit.\n\n'
'Use any language or framework. It does not need logins. Put the code on GitHub and, if you can, deploy it free '
'(Vercel, Netlify, Render or similar). Share the live link and the GitHub link. In your video, show it working and '
'walk through one part of the code you are proud of.',
240),

('Customer Service', 'Reply to five angry customers',
E'You work in customer care at Haraka Internet, a home internet provider in Nairobi. These five messages came in this '
'morning. Write a reply to each, as you would send it.\n\n'
'1. WhatsApp: "Third day without internet. I work from home. I have called 4 times and nobody has come. I want a refund."\n'
'2. Email: "You charged my M-Pesa twice for October, KSh 2,999 each. Ref QJK7H2L9 and QJK7H3M1."\n'
'3. Instagram comment, public: "Worst internet in Kenya. Don''t waste your money."\n'
'4. WhatsApp: "Can I move my connection to my new house in Ruaka next week? How much?"\n'
'5. Email from a business: "Our office internet is slow every afternoon. 20 staff. We are considering other providers."\n\n'
'After the replies, write a short note to your supervisor: which of the five problems should the company fix first, '
'and why.\n\n'
'Use Google Docs or Word. Share it as a view-only link.',
90),

('Sales', 'Win back lost customers for a water company',
E'Safi Water delivers 20-litre bottles to homes and offices in Kiambu. Over the last three months, 140 customers '
'stopped ordering. The sales manager has asked you to win some back.\n\n'
'1. List the five most likely reasons customers stopped, and how you would find out the real reasons.\n'
'2. Write the phone call script you would use, including how you answer "it''s too expensive" and "I''ve moved to '
'another supplier".\n'
'3. Write a WhatsApp message for customers who don''t pick up.\n'
'4. Design one offer to bring them back, and show it makes money: bottles cost KSh 120 to fill and deliver and sell '
'for KSh 300.\n'
'5. Set a target for how many you will win back in a month, and explain how you will track it.\n\n'
'Use Google Docs, Sheets or Slides. Share it as a view-only link.',
150),

('Graphic Designer', 'New look for a chapati and tea kiosk',
E'Mama Wanjiru''s Chapati Point is a busy kiosk near a bus stage in Rongai. She is opening a second branch and wants '
'it to look like a proper brand, not just a kiosk. Customers are mostly matatu crews, students and people going to work.\n\n'
'1. Design a logo, with a one-colour version that works painted on a wall.\n'
'2. Choose colours and fonts and explain why they suit her customers.\n'
'3. Design a menu board (chapati, mandazi, beans, tea, coffee, soup) that can be read from 3 metres away.\n'
'4. Design one WhatsApp status advert announcing the new branch.\n\n'
'Use any design tool. Share one view-only link to all the work (Canva, Figma, Behance or Google Drive). In your '
'video, explain the choices you made.',
210),

('Content Writer', 'Website pages for a boda boda insurance company',
E'Linda Boda is a new company selling motorbike insurance to boda boda riders. Riders can pay daily through M-Pesa '
'from KSh 50. Most riders read on their phones, many in a hurry, and some are not comfortable reading long English.\n\n'
'1. Write the home page: headline, short explanation, how it works in 3 steps, and a clear button.\n'
'2. Write an FAQ with 8 questions riders would really ask, including what happens after an accident.\n'
'3. Write a 600-word blog post that would help a rider, for example how to avoid having your bike stolen.\n'
'4. Write the same home page headline and button in Kiswahili.\n\n'
'Use Google Docs. Share it as a view-only link.',
180),

('Social Media Manager', 'One month of TikTok for a salon',
E'Glow Studio is a salon in Kisumu that does braids, nails and makeup. Its TikTok has 900 followers and posts once a '
'month. The owner wants more bookings, which come in through WhatsApp.\n\n'
'1. Look at three salons in Kenya that do well on TikTok and say what they do that Glow Studio doesn''t.\n'
'2. Plan four weeks of posts: what each video is, the hook in the first 3 seconds, and the caption.\n'
'3. Make one of the videos yourself (any topic from your plan, you can use free stock clips) and post it as unlisted '
'or share the file.\n'
'4. Say which three numbers the owner should check every week, and what good looks like after a month.\n\n'
'Use Canva, CapCut or any tool. Share it as a view-only link.',
180),

('HR', 'Hiring two shop attendants',
E'Fresh Basket, a grocery shop in Eldoret with 12 staff, needs two new shop attendants. Last time the owner hired '
'through friends, and both people left within two months.\n\n'
'1. Write the job advert, including pay (KSh 18,000 a month) and working hours, for a Facebook group and a WhatsApp '
'status.\n'
'2. Write 6 interview questions and what a good answer sounds like for each.\n'
'3. Design a 15-minute practical test candidates do in the shop.\n'
'4. Write a one-page plan for the new attendants'' first week, so they stay.\n'
'5. List what the owner must do by law when they join: contract, NSSF, SHIF and the housing levy.\n\n'
'Use Google Docs or Word. Share it as a view-only link.',
150),

('Admin / Office', 'Organise a staff training day',
E'You are the office assistant at a small accounting firm in Nairobi CBD with 25 staff. The partners want a one-day '
'training for all staff on a Saturday next month, outside the office. The budget is KSh 120,000.\n\n'
'1. Find three real venues in or near Nairobi that could work and compare them in a table: cost, capacity, '
'transport, food.\n'
'2. Recommend one and show the full budget: venue, food, transport, materials, and what is left over.\n'
'3. Write the email inviting staff, and the reminder sent two days before.\n'
'4. Make a checklist of everything to do, with dates, from today to the day after the training.\n\n'
'Use Google Docs or Sheets. Share it as a view-only link.',
150),

('Procurement', 'Choose a supplier for school uniforms',
E'A private primary school in Machakos needs 400 uniform sets (shirt, shorts or skirt, sweater) delivered before '
'January. Three suppliers sent quotes:\n\n'
'Supplier A: KSh 2,150 per set, delivery in 6 weeks, 50% deposit, has supplied the school before.\n'
'Supplier B: KSh 1,850 per set, delivery in 9 weeks, 30% deposit, new supplier, sent good samples.\n'
'Supplier C: KSh 1,990 per set, delivery in 5 weeks, full payment on delivery, samples had loose stitching.\n\n'
'Today is 20 October.\n\n'
'1. Compare the three on cost, risk and timing in a table, with how much each would cost in total.\n'
'2. Recommend one, and say what you would negotiate before signing.\n'
'3. List the questions you would ask each supplier and the checks you would do.\n'
'4. Write the short memo to the school bursar with your recommendation.\n\n'
'Use Excel, Google Sheets or Docs. Share it as a view-only link.',
120),

('Logistics', 'Plan a week of deliveries for a flour distributor',
E'A flour distributor in Nakuru delivers to 30 shops across Nakuru, Naivasha, Gilgil and Molo. It has two lorries, '
'each carrying up to 200 bales. Right now the drivers decide their own routes, fuel costs are rising, and shops '
'complain that deliveries come on random days.\n\n'
'1. Make up a realistic list of the 30 shops with their towns and how many bales each orders a week (between 10 and 60).\n'
'2. Plan a weekly delivery timetable: which lorry goes where on which day, and how many bales it carries.\n'
'3. Estimate the kilometres and fuel cost per week using real distances from Google Maps. Diesel is about KSh 170 a litre '
'and a lorry does about 4 km per litre.\n'
'4. Write a short message to shop owners explaining their new fixed delivery day.\n\n'
'Use Excel or Google Sheets. Share it as a view-only link.',
210),

('IT Support', 'Fix the IT at a small clinic',
E'A clinic in Thika has 8 computers, one printer, and internet from a single router. The manager says: "The internet '
'is slow, the printer only works on one computer, everyone uses the same password, and we lost patient files last '
'year when a computer died."\n\n'
'1. List the questions you would ask and what you would check on your first visit.\n'
'2. Explain step by step how you would make the printer work on all 8 computers.\n'
'3. Write a simple backup plan so patient files are never lost again, with the cost.\n'
'4. Write a one-page guide for staff on passwords and spotting fake emails, in simple language.\n'
'5. Give the manager a list of fixes in order of priority, with rough costs in KSh.\n\n'
'Use Google Docs or Word. Share it as a view-only link.',
150),

('Finance', 'Should the bakery buy a second oven?',
E'Tamu Bakery in Kakamega sells about 600 loaves a day at KSh 60 each. Ingredients and packaging cost KSh 32 a loaf. '
'Rent, salaries and power cost KSh 210,000 a month. The bakery cannot make more bread because its one oven is full.\n\n'
'A second oven costs KSh 850,000. It would let the bakery make up to 400 more loaves a day, but it would need one more '
'baker at KSh 25,000 a month and add KSh 18,000 a month to the power bill. The owner could pay cash or take a bank '
'loan at 16% a year over 3 years.\n\n'
'1. Build a monthly profit model for today and with the second oven, assuming 30 baking days a month.\n'
'2. Work out how many extra loaves a day are needed to break even, and how long the oven takes to pay for itself.\n'
'3. Compare paying cash with taking the loan.\n'
'4. Give your recommendation on one page, including what could go wrong.\n\n'
'Use Excel or Google Sheets. Share it as a view-only link.',
180)

) as v(role, title, instructions, minutes)
where not exists (select 1 from public.tasks t where t.title = v.title and t.company_id is null);
