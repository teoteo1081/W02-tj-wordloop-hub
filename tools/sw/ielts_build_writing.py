import json, os
from ielts_charts import *

os.makedirs('img_w', exist_ok=True)
Y = lambda a, b, s: list(range(a, b + 1, s))
T = []


def add(n, label, img, t1, t2):
    img.save('img_w/w%02d.png' % n); T.append({'n': n, 'label': label, 't1': t1, 't2': t2})


add(1, 'Comparative graph · Crime rates in England and Wales + Positive or negative development (Education)',
    line_chart('Recorded crime in England and Wales, 1990-2010', Y(1990, 2010, 4), [('Burglary', [14, 15, 13, 11, 8, 6]), ('Vehicle theft', [10, 12, 9, 6, 4, 3]), ('Violent crime', [5, 6, 8, 9, 10, 9])], 0, 16, 2, 'Offences per 1,000 people'),
    'The graph below shows the rates of three types of recorded crime in England and Wales between 1990 and 2010. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    'In many countries, more and more young people are choosing to study online instead of attending a traditional school or university. Is this a positive or negative development? Give reasons for your answer and include any relevant examples from your own knowledge or experience.')
add(2, 'Comparative graph · Weekly work hours in four European countries + Discussion (Society)',
    bar_chart('Average weekly working hours in industry', ['Germany', 'France', 'Spain', 'Poland'], [('1995', [38, 39, 41, 44]), ('2015', [35, 36, 38, 40])], 0, 50, 10, 'Hours per week'),
    'The bar chart below shows the average number of hours worked per week in industry in four European countries in 1995 and 2015. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    'Some people think that a shorter working week would make employees happier and more productive. Others believe that working fewer hours would harm the economy. Discuss both views and give your own opinion.')
add(3, 'Graph with a trend · Birth and death rates in New Zealand + Problems/Solutions (Education)',
    line_chart('Birth and death rates in New Zealand, 1960-2020', Y(1960, 2020, 10), [('Birth rate', [26, 22, 18, 16, 15, 13, 12]), ('Death rate', [9, 8.5, 8, 7.5, 7, 6.8, 6.5])], 0, 30, 5, 'Per 1,000 people'),
    'The graph below shows the birth and death rates in New Zealand between 1960 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    'In many countries, a large number of students leave school without basic reading, writing and maths skills. What problems does this cause, and what measures could be taken to solve them?')
add(4, 'Graph with a trend · Internet access in three countries + Opinion essay (Society)',
    line_chart('Households with internet access (%)', Y(2000, 2020, 4), [('United Kingdom', [25, 55, 75, 83, 90, 95]), ('Brazil', [5, 14, 30, 48, 66, 79]), ('India', [1, 3, 8, 18, 35, 52])], 0, 100, 20, 'Percentage of households'),
    'The line graph below shows the percentage of households with internet access in three countries between 2000 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    'Some people say that the internet has made people less sociable and has damaged relationships between family members and friends. To what extent do you agree or disagree?')
add(5, 'Graph with a trend · Purchasing power of the Japanese yen + Opinion essay (Education)',
    line_chart('Purchasing power of the Japanese yen (index, 1990 = 100)', Y(1990, 2020, 5), [('Yen purchasing power', [100, 108, 112, 105, 96, 92, 85])], 60, 120, 10, 'Index (1990 = 100)'),
    'The graph below shows changes in the purchasing power of the Japanese yen between 1990 and 2020 (1990 = 100). Summarise the information by selecting and reporting the main features.',
    'Some people believe that university education should be free for everyone. Others think students should pay for their own studies. To what extent do you agree or disagree?')
add(6, 'Graphs with a trend · Age distribution 1960-2040 + Advantages/Disadvantages (Society)',
    bar_chart('Age distribution of a country (% of population)', [1960, 1980, 2000, 2020, 2040], [('0-14', [34, 29, 22, 18, 15]), ('15-64', [60, 63, 66, 65, 60]), ('65+', [6, 8, 12, 17, 25])], 0, 100, 20, '% of population', stacked=True),
    'The chart below shows the age distribution of the population of a country in 1960, 1980, 2000 and 2020, with projections for 2040. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    'In many countries, people are living longer and the proportion of older people is increasing. Do the advantages of this development outweigh the disadvantages?')
add(7, 'Graphs with a trend · Birth rates in the UK + Discussion (Society)',
    line_chart('Births per woman in the United Kingdom', Y(1950, 2020, 10), [('Fertility rate', [2.2, 2.7, 2.4, 1.8, 1.8, 1.7, 1.7, 1.8])], 1, 3, 0.5, 'Births per woman'),
    'The graph below shows the average number of children born per woman in the United Kingdom between 1950 and 2020. Summarise the information by selecting and reporting the main features.',
    'Some people think that families should be responsible for looking after elderly relatives. Others believe the government should provide care for older people. Discuss both views and give your own opinion.')
add(8, 'Graphs with a trend · CO2 emissions of five regions + Problems/Solutions (Society)',
    line_chart('CO2 emissions by region (million tonnes)', Y(1990, 2030, 10), [('Asia', [3500, 5200, 8000, 11000, 12500]), ('North America', [5500, 6200, 6400, 5900, 5200]), ('Europe', [4400, 4200, 4100, 3600, 3000]), ('Africa', [700, 900, 1100, 1400, 1800]), ('Oceania', [300, 380, 450, 480, 500])], 0, 14000, 2000, 'Million tonnes'),
    'The graph below shows carbon dioxide emissions in five regions between 1990 and 2030 (figures from 2020 onwards are projections). Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    'Air pollution and climate change are serious problems in many large cities. What are the main causes of these problems, and what can be done to reduce them?')
add(9, 'Graphs with a trend · Global sales of video games + Advantages/Disadvantages (Society)',
    bar_chart('Global video game sales by platform (billion US$)', [2005, 2010, 2015, 2020], [('Console', [18, 24, 26, 30]), ('Mobile', [2, 8, 30, 70]), ('PC', [6, 10, 20, 35])], 0, 140, 20, 'Billion US dollars', stacked=True),
    'The chart below shows global sales of video games on three platforms between 2005 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    'Playing video games has become very popular among both children and adults. Do the advantages of this trend outweigh the disadvantages?')
add(10, "Graphs with a trend · People's access to news + Discussion (Work & Leadership)",
    line_chart('Main source of news (% of adults)', Y(1990, 2020, 5), [('Television', [60, 58, 52, 46, 38, 30, 24]), ('Newspapers', [30, 26, 20, 14, 9, 6, 4]), ('Online', [0, 2, 10, 25, 42, 58, 68]), ('Radio', [10, 14, 18, 15, 11, 6, 4])], 0, 80, 10, '% of adults'),
    'The graph below shows the main sources from which adults in one country got their news between 1990 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    'Some people think a good leader should make decisions alone, while others believe leaders should consult their team before making decisions. Discuss both views and give your own opinion.')
add(11, 'Graphs with a trend · Unemployment rate + Causes/Solutions (Society)',
    line_chart('Unemployment rate (%)', Y(2000, 2020, 2), [('Country A', [7, 6, 5, 9, 8, 6, 5, 8, 12, 9, 6]), ('Country B', [4, 4, 3.5, 3, 5, 7, 6, 4, 3.5, 3.2, 3]), ('Country C', [11, 12, 12, 10, 9, 8, 8, 10, 14, 13, 11])], 0, 16, 2, 'Unemployment rate (%)'),
    'The graph below shows the unemployment rate in three countries between 2000 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    'In many countries, a growing number of young people cannot find a job. What are the causes of youth unemployment, and what measures could governments take to tackle it?')
add(12, 'Mixed charts · Imported seafood in the UK + Causes/Solutions (Health)',
    mixed('Seafood imported into the UK', ['Salmon', 'Tuna', 'Shrimp', 'Cod', 'Other'], [120, 90, 80, 60, 40], 'Thousand tonnes (2020)', 'Share by origin', [('Norway', 38), ('Asia', 30), ('S. America', 20), ('Other', 12)]),
    'The bar chart shows the amount of seafood imported into the UK in 2020 by type, and the pie chart shows the share of imports by region of origin. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    'In many countries, more and more people suffer from health problems caused by an unhealthy lifestyle. What are the causes of this, and what solutions can you suggest?')
add(13, 'Process diagram · Life cycle of a butterfly + Advantages/Disadvantages (Education)',
    cycle('The life cycle of a butterfly', [('Egg', 'laid on a leaf · 1 week'), ('Caterpillar', 'feeds on leaves · 2-4 weeks'), ('Chrysalis', 'pupa stage · 1-2 weeks'), ('Adult butterfly', 'emerges and flies · 2-4 weeks')]),
    'The diagram below shows the life cycle of a butterfly. Summarise the information by selecting and reporting the main features.',
    'Some schools now teach all subjects through technology, such as tablets and online lessons, instead of using textbooks and teachers in classrooms. Do the advantages of this development outweigh the disadvantages?')
json.dump(T, open('wdata.json', 'w', encoding='utf-8'), ensure_ascii=False)
print(len(T))
