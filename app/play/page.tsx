"use client";

import { useState } from "react";
import Link from "next/link";
import { channelConfig } from "@/lib/config";

// ── Types ──────────────────────────────────────────────────────────────────────
interface QuizQ {
  id: string;
  cat: string;
  ageGroup: "Kids" | "Teens" | "Adults";
  diff: "Easy" | "Medium" | "Hard";
  q: string;
  opts: string[];
  ans: number;
  exp: string;
}

// ── Full question bank ─────────────────────────────────────────────────────────
const ALL_QS: QuizQ[] = [

  // ══════════════════════════════════════════════════════════════════════════════
  // 🔬 SCIENCE
  // ══════════════════════════════════════════════════════════════════════════════
  // Kids
  { id:"sc1", cat:"Science", ageGroup:"Kids", diff:"Easy",
    q:"What does a caterpillar turn into?",
    opts:["Bee","Butterfly","Spider","Grasshopper"], ans:1,
    exp:"A caterpillar wraps itself in a cocoon (chrysalis) and transforms into a beautiful butterfly — this is called metamorphosis!" },
  { id:"sc2", cat:"Science", ageGroup:"Kids", diff:"Easy",
    q:"What gas do plants breathe in to make food?",
    opts:["Oxygen","Nitrogen","Carbon dioxide","Hydrogen"], ans:2,
    exp:"Plants take in carbon dioxide from the air and use sunlight to turn it into food — a process called photosynthesis." },
  { id:"sc3", cat:"Science", ageGroup:"Kids", diff:"Easy",
    q:"How many bones does an adult human body have?",
    opts:["106","206","306","406"], ans:1,
    exp:"Adults have 206 bones. Babies are born with about 270 bones — some fuse together as you grow up!" },
  { id:"sc4", cat:"Science", ageGroup:"Kids", diff:"Easy",
    q:"What is the closest star to Earth?",
    opts:["Sirius","Betelgeuse","The Sun","Proxima Centauri"], ans:2,
    exp:"The Sun is our nearest star — just 93 million miles away. The next closest star (Proxima Centauri) is 4.24 light-years away!" },
  { id:"sc5", cat:"Science", ageGroup:"Kids", diff:"Easy",
    q:"What do magnets have that attract metals?",
    opts:["Gravity","Magnetic poles","Static electricity","Heat"], ans:1,
    exp:"Magnets have a north and south pole. Opposite poles attract, same poles repel — this is magnetic force!" },

  // Teens
  { id:"sc6", cat:"Science", ageGroup:"Teens", diff:"Medium",
    q:"What is the powerhouse of the cell?",
    opts:["Nucleus","Ribosome","Mitochondria","Chloroplast"], ans:2,
    exp:"Mitochondria generate ATP (energy) through cellular respiration. Every cell in your body runs on ATP!" },
  { id:"sc7", cat:"Science", ageGroup:"Teens", diff:"Medium",
    q:"What is Newton's Third Law of Motion?",
    opts:["F=ma","Objects at rest stay at rest","Every action has an equal and opposite reaction","Gravity is proportional to mass"], ans:2,
    exp:"For every action there is an equal and opposite reaction — that's why rockets fly upward by pushing exhaust downward." },
  { id:"sc8", cat:"Science", ageGroup:"Teens", diff:"Medium",
    q:"What element has the chemical symbol 'Fe'?",
    opts:["Fluorine","Francium","Iron","Fermium"], ans:2,
    exp:"Fe comes from the Latin word 'Ferrum' meaning iron. Iron is the most abundant element on Earth by mass." },
  { id:"sc9", cat:"Science", ageGroup:"Teens", diff:"Medium",
    q:"What is the speed of light in a vacuum?",
    opts:["300 km/s","3,000 km/s","300,000 km/s","3,000,000 km/s"], ans:2,
    exp:"Light travels at approximately 299,792 km/s (about 300,000 km/s) in a vacuum — the ultimate cosmic speed limit!" },
  { id:"sc10", cat:"Science", ageGroup:"Teens", diff:"Medium",
    q:"Which planet has the most moons in our solar system?",
    opts:["Jupiter","Saturn","Uranus","Neptune"], ans:1,
    exp:"Saturn holds the record with 146 confirmed moons! Jupiter comes second. Saturn's rings are made of ice and rock." },

  // Adults
  { id:"sc11", cat:"Science", ageGroup:"Adults", diff:"Hard",
    q:"What is the Higgs boson often called?",
    opts:["The speed particle","The God particle","The dark particle","The quantum particle"], ans:1,
    exp:"The Higgs boson is called the 'God particle' — it gives other particles mass via the Higgs field, confirmed by CERN in 2012." },
  { id:"sc12", cat:"Science", ageGroup:"Adults", diff:"Hard",
    q:"What is CRISPR-Cas9 used for?",
    opts:["DNA sequencing","Gene editing","Protein synthesis","Cell cloning"], ans:1,
    exp:"CRISPR-Cas9 is a revolutionary gene-editing tool — it acts like molecular scissors to cut and modify DNA with precision." },
  { id:"sc13", cat:"Science", ageGroup:"Adults", diff:"Hard",
    q:"What does E=mc² represent?",
    opts:["Energy equals mass divided by speed","Energy equals mass times speed of light squared","Electron mass constant","Electromagnetic constant"], ans:1,
    exp:"Einstein's famous equation states that energy (E) equals mass (m) times the speed of light (c) squared — mass and energy are interchangeable!" },
  { id:"sc14", cat:"Science", ageGroup:"Adults", diff:"Hard",
    q:"What is dark matter?",
    opts:["Black holes","Invisible matter that makes up 27% of the universe","Anti-matter","Compressed gases"], ans:1,
    exp:"Dark matter makes up ~27% of the universe. We can't see it but detect its gravitational effects. Its nature remains unknown!" },
  { id:"sc15", cat:"Science", ageGroup:"Adults", diff:"Hard",
    q:"What is quantum entanglement?",
    opts:["Atoms splitting","Two particles sharing quantum states instantly regardless of distance","Electron orbits","Nuclear fusion"], ans:1,
    exp:"Entangled particles instantaneously affect each other regardless of distance — Einstein called it 'spooky action at a distance'!" },

  // ══════════════════════════════════════════════════════════════════════════════
  // ⚽ SPORTS
  // ══════════════════════════════════════════════════════════════════════════════
  // Kids
  { id:"sp1", cat:"Sports", ageGroup:"Kids", diff:"Easy",
    q:"How many players are on a soccer (football) team on the field?",
    opts:["9","10","11","12"], ans:2,
    exp:"Each soccer team has 11 players on the field, including the goalkeeper. Total 22 players in a match!" },
  { id:"sp2", cat:"Sports", ageGroup:"Kids", diff:"Easy",
    q:"In basketball, how many points is a free throw worth?",
    opts:["1","2","3","4"], ans:0,
    exp:"A free throw is worth 1 point. Regular shots from inside the arc = 2 points. Shots beyond the 3-point line = 3 points!" },
  { id:"sp3", cat:"Sports", ageGroup:"Kids", diff:"Easy",
    q:"Which sport uses a shuttlecock?",
    opts:["Tennis","Badminton","Squash","Table Tennis"], ans:1,
    exp:"Badminton uses a shuttlecock (also called a birdie) — it can travel over 300 km/h when smashed by professionals!" },
  { id:"sp4", cat:"Sports", ageGroup:"Kids", diff:"Easy",
    q:"In cricket, how many stumps make a wicket?",
    opts:["2","3","4","5"], ans:1,
    exp:"A cricket wicket has 3 stumps with 2 bails on top. A batsman is out if the bails are knocked off!" },
  { id:"sp5", cat:"Sports", ageGroup:"Kids", diff:"Easy",
    q:"What color jersey does the Indian cricket team wear in ODIs?",
    opts:["White","Red","Blue","Green"], ans:2,
    exp:"Team India wears blue jerseys in ODIs and T20s, earning the nickname 'Men in Blue'. Blue represents sky and water." },

  // Teens
  { id:"sp6", cat:"Sports", ageGroup:"Teens", diff:"Medium",
    q:"How many Grand Slam tennis tournaments are held each year?",
    opts:["2","3","4","5"], ans:2,
    exp:"There are 4 Grand Slams: Australian Open, French Open (Roland Garros), Wimbledon, and US Open. Hardest to win all 4 in a year!" },
  { id:"sp7", cat:"Sports", ageGroup:"Teens", diff:"Medium",
    q:"Which country has won the most FIFA World Cup titles?",
    opts:["Germany","Argentina","Italy","Brazil"], ans:3,
    exp:"Brazil has won the FIFA World Cup 5 times (1958, 1962, 1970, 1994, 2002). They're the only team to qualify for every World Cup!" },
  { id:"sp8", cat:"Sports", ageGroup:"Teens", diff:"Medium",
    q:"In which sport would you perform a 'slam dunk'?",
    opts:["Volleyball","Basketball","Handball","Water Polo"], ans:1,
    exp:"A slam dunk is when a basketball player jumps and forcefully throws the ball down through the hoop. Super exciting!" },
  { id:"sp9", cat:"Sports", ageGroup:"Teens", diff:"Medium",
    q:"How long is a standard marathon race?",
    opts:["21.1 km","30 km","42.195 km","50 km"], ans:2,
    exp:"A marathon is 42.195 km (26.2 miles). The distance comes from the legend of Pheidippides running from Marathon to Athens in 490 BC!" },
  { id:"sp10", cat:"Sports", ageGroup:"Teens", diff:"Medium",
    q:"Which Indian cricketer is known as 'God of Cricket'?",
    opts:["Virat Kohli","MS Dhoni","Sachin Tendulkar","Sourav Ganguly"], ans:2,
    exp:"Sachin Tendulkar holds the record for most runs and centuries in both Tests and ODIs — rightfully called the 'God of Cricket'!" },

  // Adults
  { id:"sp11", cat:"Sports", ageGroup:"Adults", diff:"Hard",
    q:"What is the 'Ashes' series in cricket?",
    opts:["India vs Pakistan","England vs Australia","South Africa vs New Zealand","West Indies vs England"], ans:1,
    exp:"The Ashes is the iconic Test cricket rivalry between England and Australia dating back to 1882 when England 'cremated' Australian cricket!" },
  { id:"sp12", cat:"Sports", ageGroup:"Adults", diff:"Hard",
    q:"Which athlete has won the most Olympic gold medals ever?",
    opts:["Carl Lewis","Usain Bolt","Michael Phelps","Mark Spitz"], ans:2,
    exp:"Michael Phelps won 23 Olympic gold medals in swimming — the most by any athlete in history. He competed in 4 Olympic Games!" },
  { id:"sp13", cat:"Sports", ageGroup:"Adults", diff:"Hard",
    q:"In F1 racing, what does DRS stand for?",
    opts:["Dynamic Race Speed","Drag Reduction System","Driver Race Strategy","Directional Racing System"], ans:1,
    exp:"DRS (Drag Reduction System) opens a flap on the rear wing to reduce drag and increase speed on straights — used for overtaking!" },
  { id:"sp14", cat:"Sports", ageGroup:"Adults", diff:"Hard",
    q:"How many points does a team get for winning a Premier League match?",
    opts:["1","2","3","4"], ans:2,
    exp:"Win = 3 points, Draw = 1 point each, Loss = 0 points. This system was introduced in 1981 to encourage more attacking football!" },
  { id:"sp15", cat:"Sports", ageGroup:"Adults", diff:"Hard",
    q:"In which year did India win its first Cricket World Cup?",
    opts:["1975","1979","1983","1987"], ans:2,
    exp:"India won the 1983 Cricket World Cup under Kapil Dev's captaincy — a historic upset that transformed Indian cricket forever!" },

  // ══════════════════════════════════════════════════════════════════════════════
  // 🏛️ HISTORY
  // ══════════════════════════════════════════════════════════════════════════════
  // Kids
  { id:"hi1", cat:"History", ageGroup:"Kids", diff:"Easy",
    q:"Who built the Great Wall of China?",
    opts:["The Romans","The Chinese emperors and their workers","The Mongols","The Japanese"], ans:1,
    exp:"The Great Wall was built by Chinese emperors over centuries (mainly Ming Dynasty, 1368–1644) to protect against invasions. It stretches 21,196 km!" },
  { id:"hi2", cat:"History", ageGroup:"Kids", diff:"Easy",
    q:"Who was the first Prime Minister of independent India?",
    opts:["Mahatma Gandhi","Sardar Patel","Jawaharlal Nehru","Dr. B.R. Ambedkar"], ans:2,
    exp:"Jawaharlal Nehru became India's first Prime Minister on August 15, 1947, delivering his famous 'Tryst with Destiny' speech." },
  { id:"hi3", cat:"History", ageGroup:"Kids", diff:"Easy",
    q:"What ancient wonder was located in Egypt?",
    opts:["The Colosseum","The Great Pyramid of Giza","The Hanging Gardens","The Parthenon"], ans:1,
    exp:"The Great Pyramid of Giza (built ~2560 BC) is the only ancient wonder still standing today! It was built as a tomb for Pharaoh Khufu." },
  { id:"hi4", cat:"History", ageGroup:"Kids", diff:"Easy",
    q:"In what year did India gain independence from British rule?",
    opts:["1945","1947","1950","1952"], ans:1,
    exp:"India gained independence on August 15, 1947, after a long freedom struggle. India became a Republic on January 26, 1950 — our Republic Day!" },
  { id:"hi5", cat:"History", ageGroup:"Kids", diff:"Easy",
    q:"What is Mahatma Gandhi famous for?",
    opts:["Inventing electricity","Leading India to independence through non-violence","Discovering gravity","Building the Taj Mahal"], ans:1,
    exp:"Gandhi used peaceful protests (satyagraha) and non-violent resistance (ahimsa) to fight British rule. He's called 'Father of the Nation'." },

  // Teens
  { id:"hi6", cat:"History", ageGroup:"Teens", diff:"Medium",
    q:"Which war was fought between 1939 and 1945?",
    opts:["World War I","The Cold War","World War II","The Korean War"], ans:2,
    exp:"World War II (1939–1945) was the deadliest conflict in history involving over 30 countries, resulting in 70–85 million deaths." },
  { id:"hi7", cat:"History", ageGroup:"Teens", diff:"Medium",
    q:"Who was the first person to walk on the Moon?",
    opts:["Buzz Aldrin","Yuri Gagarin","Neil Armstrong","John Glenn"], ans:2,
    exp:"Neil Armstrong became the first person to walk on the Moon on July 20, 1969, saying 'That's one small step for man, one giant leap for mankind'." },
  { id:"hi8", cat:"History", ageGroup:"Teens", diff:"Medium",
    q:"Who wrote and published the Communist Manifesto?",
    opts:["Lenin and Stalin","Marx and Engels","Rousseau and Voltaire","Darwin and Huxley"], ans:1,
    exp:"Karl Marx and Friedrich Engels published the Communist Manifesto in 1848 — it influenced revolutions and political systems worldwide." },
  { id:"hi9", cat:"History", ageGroup:"Teens", diff:"Medium",
    q:"Which Indian emperor spread Buddhism across Asia?",
    opts:["Chandragupta Maurya","Aurangzeb","Ashoka","Akbar"], ans:2,
    exp:"Emperor Ashoka (268–232 BC) converted to Buddhism after the bloody Kalinga War and spread Buddhist teachings across Asia and beyond." },
  { id:"hi10", cat:"History", ageGroup:"Teens", diff:"Medium",
    q:"What caused the Great Fire of London in 1666?",
    opts:["A bomb","A bakery in Pudding Lane","A lightning strike","A factory explosion"], ans:1,
    exp:"The Great Fire started in a bakery on Pudding Lane on September 2, 1666. It destroyed 13,200 houses and 87 churches including St Paul's Cathedral!" },

  // Adults
  { id:"hi11", cat:"History", ageGroup:"Adults", diff:"Hard",
    q:"What was the significance of the Treaty of Westphalia (1648)?",
    opts:["Ended WWI","Established modern concept of nation-state sovereignty","Divided Africa","Started the Crusades"], ans:1,
    exp:"The 1648 Treaty of Westphalia ended the Thirty Years' War and established the principle that each state has sovereignty over its territory — the basis of modern international law." },
  { id:"hi12", cat:"History", ageGroup:"Adults", diff:"Hard",
    q:"Who was the leader of the Cuban Revolution?",
    opts:["Che Guevara","Hugo Chavez","Fidel Castro","Salvador Allende"], ans:2,
    exp:"Fidel Castro led the Cuban Revolution (1959), overthrowing Batista and establishing a Communist state. He ruled Cuba until 2008." },
  { id:"hi13", cat:"History", ageGroup:"Adults", diff:"Hard",
    q:"The partition of India in 1947 created which two independent nations?",
    opts:["India and Bangladesh","India and Pakistan","India and Sri Lanka","India and Nepal"], ans:1,
    exp:"The Partition of 1947 created India and Pakistan. It caused one of history's largest mass migrations with ~15 million people displaced and immense communal violence." },
  { id:"hi14", cat:"History", ageGroup:"Adults", diff:"Hard",
    q:"What was the name of the first artificial satellite launched into space?",
    opts:["Explorer 1","Vostok 1","Sputnik 1","Luna 1"], ans:2,
    exp:"Sputnik 1, launched by the Soviet Union on October 4, 1957, was the first artificial satellite — it triggered the Space Race with the USA." },
  { id:"hi15", cat:"History", ageGroup:"Adults", diff:"Hard",
    q:"Which empire was known as 'the empire on which the sun never sets'?",
    opts:["Roman Empire","Ottoman Empire","Spanish Empire","British Empire"], ans:3,
    exp:"The British Empire at its peak (19th–early 20th century) covered 25% of Earth's land. The phrase means it always spanned a timezone with daylight." },

  // ══════════════════════════════════════════════════════════════════════════════
  // 🌍 GEOGRAPHY
  // ══════════════════════════════════════════════════════════════════════════════
  // Kids
  { id:"ge1", cat:"Geography", ageGroup:"Kids", diff:"Easy",
    q:"What is the largest ocean on Earth?",
    opts:["Atlantic Ocean","Indian Ocean","Arctic Ocean","Pacific Ocean"], ans:3,
    exp:"The Pacific Ocean is the largest and deepest ocean, covering more than 30% of Earth's surface — bigger than all land on Earth combined!" },
  { id:"ge2", cat:"Geography", ageGroup:"Kids", diff:"Easy",
    q:"What is the capital of India?",
    opts:["Mumbai","Kolkata","New Delhi","Chennai"], ans:2,
    exp:"New Delhi is the capital of India. It became the capital when the British moved it from Kolkata (then Calcutta) in 1911." },
  { id:"ge3", cat:"Geography", ageGroup:"Kids", diff:"Easy",
    q:"Which is the longest river in India?",
    opts:["Yamuna","Godavari","Brahmaputra","Ganga (Ganges)"], ans:3,
    exp:"The Ganga (Ganges) at 2,525 km is India's longest river. It's also considered sacred and flows through some of India's most populated areas." },
  { id:"ge4", cat:"Geography", ageGroup:"Kids", diff:"Easy",
    q:"On which continent is the Amazon rainforest located?",
    opts:["Africa","Asia","South America","Australia"], ans:2,
    exp:"The Amazon rainforest in South America is the world's largest tropical rainforest — it produces 20% of Earth's oxygen!" },
  { id:"ge5", cat:"Geography", ageGroup:"Kids", diff:"Easy",
    q:"What is the tallest mountain in the world?",
    opts:["K2","Kangchenjunga","Mount Kilimanjaro","Mount Everest"], ans:3,
    exp:"Mount Everest at 8,849 metres (29,032 feet) is Earth's highest peak above sea level. It sits on the Nepal-Tibet border." },

  // Teens
  { id:"ge6", cat:"Geography", ageGroup:"Teens", diff:"Medium",
    q:"Which is the smallest country in the world by area?",
    opts:["Monaco","San Marino","Vatican City","Liechtenstein"], ans:2,
    exp:"Vatican City (0.44 km²) is the world's smallest country. It's an independent city-state within Rome, ruled by the Pope." },
  { id:"ge7", cat:"Geography", ageGroup:"Teens", diff:"Medium",
    q:"Through how many countries does the Amazon River flow?",
    opts:["2","3","4","5"], ans:1,
    exp:"The Amazon flows primarily through Brazil but also passes through Peru and Colombia — it's the world's largest river by discharge volume." },
  { id:"ge8", cat:"Geography", ageGroup:"Teens", diff:"Medium",
    q:"What is the driest place on Earth?",
    opts:["Sahara Desert","Arabian Desert","Atacama Desert","Gobi Desert"], ans:2,
    exp:"The Atacama Desert in South America is the world's driest place. Some weather stations there have never recorded rainfall!" },
  { id:"ge9", cat:"Geography", ageGroup:"Teens", diff:"Medium",
    q:"Which Indian state has the longest coastline?",
    opts:["Kerala","Andhra Pradesh","Gujarat","Tamil Nadu"], ans:2,
    exp:"Gujarat has India's longest coastline at 1,600 km. Its coastline is complex with many gulfs, peninsulas and islands." },
  { id:"ge10", cat:"Geography", ageGroup:"Teens", diff:"Medium",
    q:"What separates India from Sri Lanka?",
    opts:["Bay of Bengal","Arabian Sea","Palk Strait","Laccadive Sea"], ans:2,
    exp:"The Palk Strait separates India (Tamil Nadu) from Sri Lanka. It's only 53 km wide at its narrowest point." },

  // Adults
  { id:"ge11", cat:"Geography", ageGroup:"Adults", diff:"Hard",
    q:"What is the name of the tectonic plate boundary where India collides with Asia?",
    opts:["Pacific Ring of Fire","Himalayan Convergent Boundary","Mid-Atlantic Ridge","Alpine Fault"], ans:1,
    exp:"The Indian plate colliding with the Eurasian plate at the Himalayan Convergent Boundary formed the Himalayas — still pushing them higher!" },
  { id:"ge12", cat:"Geography", ageGroup:"Adults", diff:"Hard",
    q:"Which country has the most time zones?",
    opts:["Russia","USA","China","France"], ans:3,
    exp:"France has 12 time zones when including overseas territories! Russia has 11. Despite spanning 9,000+ km, all of China uses one time zone." },
  { id:"ge13", cat:"Geography", ageGroup:"Adults", diff:"Hard",
    q:"What is the Tropic of Cancer?",
    opts:["Earth's equator","The 23.5°N latitude line marking the sun's northernmost position","The border of the Arctic","The 30°N latitude line"], ans:1,
    exp:"The Tropic of Cancer at ~23.5°N is the northernmost latitude where the sun is directly overhead (at summer solstice). India, China, and many countries lie on it." },
  { id:"ge14", cat:"Geography", ageGroup:"Adults", diff:"Hard",
    q:"The Strait of Hormuz is strategically important because it controls access to what?",
    opts:["Pacific trade routes","The Suez Canal","Persian Gulf oil exports","Mediterranean shipping"], ans:2,
    exp:"~20% of the world's oil passes through the Strait of Hormuz — making it the world's most strategically important chokepoint." },
  { id:"ge15", cat:"Geography", ageGroup:"Adults", diff:"Hard",
    q:"What is the Sahel region?",
    opts:["A rainforest in Congo","A semi-arid belt south of the Sahara across Africa","A coastal region in West Africa","A mountain range in North Africa"], ans:1,
    exp:"The Sahel is a semi-arid transition zone stretching from Senegal to Eritrea, south of the Sahara — facing severe desertification and climate challenges." },

  // ══════════════════════════════════════════════════════════════════════════════
  // 💡 GENERAL KNOWLEDGE
  // ══════════════════════════════════════════════════════════════════════════════
  // Kids
  { id:"gk1", cat:"General Knowledge", ageGroup:"Kids", diff:"Easy",
    q:"How many colors are in a rainbow?",
    opts:["5","6","7","8"], ans:2,
    exp:"A rainbow has 7 colors: Red, Orange, Yellow, Green, Blue, Indigo, Violet (ROYGBIV). They appear when light bends through water droplets!" },
  { id:"gk2", cat:"General Knowledge", ageGroup:"Kids", diff:"Easy",
    q:"What is the national animal of India?",
    opts:["Elephant","Lion","Royal Bengal Tiger","Peacock"], ans:2,
    exp:"The Royal Bengal Tiger is India's national animal. The national bird is the Peacock, and the national aquatic animal is the Ganges River Dolphin!" },
  { id:"gk3", cat:"General Knowledge", ageGroup:"Kids", diff:"Easy",
    q:"What do bees collect from flowers to make honey?",
    opts:["Water","Nectar","Pollen","Dew"], ans:1,
    exp:"Bees collect nectar from flowers and store it in their hive. Over time, the nectar thickens into honey — and a bee makes only 1/12 teaspoon in its lifetime!" },
  { id:"gk4", cat:"General Knowledge", ageGroup:"Kids", diff:"Easy",
    q:"How many minutes are in one hour?",
    opts:["30","50","60","100"], ans:2,
    exp:"There are 60 minutes in an hour and 60 seconds in a minute. This comes from the ancient Babylonians who used base-60 mathematics!" },
  { id:"gk5", cat:"General Knowledge", ageGroup:"Kids", diff:"Easy",
    q:"What language has the most speakers in the world?",
    opts:["English","Hindi","Mandarin Chinese","Spanish"], ans:2,
    exp:"Mandarin Chinese has the most native speakers (~1 billion). English is the most widely spoken total (native + second language) with ~1.5 billion users!" },

  // Teens
  { id:"gk6", cat:"General Knowledge", ageGroup:"Teens", diff:"Medium",
    q:"What does UNESCO stand for?",
    opts:["United Nations Educational Scientific and Cultural Organization","UN Economic Science and Commerce Organization","Universal Network for Education Science and Culture","United Nations Environmental and Social Committee Organization"], ans:0,
    exp:"UNESCO (UN Educational, Scientific and Cultural Organization) promotes peace through education. It designates World Heritage Sites around the globe." },
  { id:"gk7", cat:"General Knowledge", ageGroup:"Teens", diff:"Medium",
    q:"Which planet is known as the Red Planet?",
    opts:["Venus","Jupiter","Mars","Mercury"], ans:2,
    exp:"Mars appears red because its surface is covered in iron oxide (rust). NASA's rovers Curiosity and Perseverance are exploring it today!" },
  { id:"gk8", cat:"General Knowledge", ageGroup:"Teens", diff:"Medium",
    q:"What does 'www' stand for in a website address?",
    opts:["World Wide Web","World Wire Web","Wide Web World","World Wireless Web"], ans:0,
    exp:"WWW stands for World Wide Web — invented by Tim Berners-Lee in 1989. The web runs on the internet but is not the same as the internet itself!" },
  { id:"gk9", cat:"General Knowledge", ageGroup:"Teens", diff:"Medium",
    q:"Which instrument does Ravi Shankar play?",
    opts:["Tabla","Flute","Sitar","Sarod"], ans:2,
    exp:"Ravi Shankar was a world-famous sitar maestro who brought Indian classical music to global audiences. He taught Beatle George Harrison!" },
  { id:"gk10", cat:"General Knowledge", ageGroup:"Teens", diff:"Medium",
    q:"What is the currency of Japan?",
    opts:["Yuan","Won","Yen","Ringgit"], ans:2,
    exp:"Japan's currency is the Yen (¥). Japan is the world's 3rd largest economy and is known for technology, anime, and being home to Mt. Fuji." },

  // Adults
  { id:"gk11", cat:"General Knowledge", ageGroup:"Adults", diff:"Hard",
    q:"What is the Dunning-Kruger effect?",
    opts:["Learning plateaus in skill development","A cognitive bias where incompetent people overestimate their ability","Increased productivity from competition","Memory loss from information overload"], ans:1,
    exp:"The Dunning-Kruger effect (1999) is where people with limited knowledge overestimate their competence. Experts tend to be more aware of what they don't know." },
  { id:"gk12", cat:"General Knowledge", ageGroup:"Adults", diff:"Hard",
    q:"Which country invented the parliamentary system of democracy?",
    opts:["France","USA","Greece","United Kingdom"], ans:3,
    exp:"The UK developed the first parliamentary system — with roots in Magna Carta (1215) and Parliament evolving over centuries. Modern democracy was later expanded by others." },
  { id:"gk13", cat:"General Knowledge", ageGroup:"Adults", diff:"Hard",
    q:"What is the Global South?",
    opts:["Antarctica","Countries south of the equator","Developing nations in Africa, Asia, Latin America","Southern hemisphere only"], ans:2,
    exp:"The Global South refers broadly to developing/emerging economies — including much of Africa, Asia, Latin America. It's political and economic, not purely geographical." },
  { id:"gk14", cat:"General Knowledge", ageGroup:"Adults", diff:"Hard",
    q:"What was the primary purpose of the Bretton Woods agreement (1944)?",
    opts:["Create the United Nations","Establish the post-WWII international monetary system","Form NATO","End the Cold War"], ans:1,
    exp:"Bretton Woods established the USD as the global reserve currency, created the IMF and World Bank, and set fixed exchange rates — shaping the modern financial system." },
  { id:"gk15", cat:"General Knowledge", ageGroup:"Adults", diff:"Hard",
    q:"What is the Overton Window?",
    opts:["A media format","The range of policies politically acceptable to the mainstream at a given time","A climate change model","A psychological test"], ans:1,
    exp:"The Overton Window describes the range of ideas a society finds acceptable at a given moment. Politicians operate within it; activists try to shift it." },

  // ══════════════════════════════════════════════════════════════════════════════
  // 💻 TECH (for all ages)
  // ══════════════════════════════════════════════════════════════════════════════
  // Kids
  { id:"tc1", cat:"Tech", ageGroup:"Kids", diff:"Easy",
    q:"What does 'AI' stand for?",
    opts:["Automatic Internet","Artificial Intelligence","Advanced Input","Alien Interface"], ans:1,
    exp:"AI stands for Artificial Intelligence — computers that can learn and solve problems like humans. Your phone's voice assistant uses AI!" },
  { id:"tc2", cat:"Tech", ageGroup:"Kids", diff:"Easy",
    q:"What does a computer use to store information while it's running?",
    opts:["Hard disk","USB drive","RAM","Battery"], ans:2,
    exp:"RAM (Random Access Memory) is the computer's 'working memory' — fast and temporary. When you turn off the computer, RAM is cleared!" },
  { id:"tc3", cat:"Tech", ageGroup:"Kids", diff:"Easy",
    q:"Who founded Microsoft?",
    opts:["Steve Jobs","Elon Musk","Mark Zuckerberg","Bill Gates"], ans:3,
    exp:"Bill Gates co-founded Microsoft with Paul Allen in 1975. Microsoft made Windows and Office — software used by billions of people worldwide!" },

  // Teens
  { id:"tc4", cat:"Tech", ageGroup:"Teens", diff:"Medium",
    q:"What does HTML stand for?",
    opts:["HyperText Markup Language","High-Tech Machine Language","Hyper Transfer Meta Link","HyperText Mode Language"], ans:0,
    exp:"HTML (HyperText Markup Language) is the standard language for creating web pages — it defines the structure and content of websites." },
  { id:"tc5", cat:"Tech", ageGroup:"Teens", diff:"Medium",
    q:"What is a 'bug' in programming?",
    opts:["A feature request","A type of virus","An error or flaw in code","A slow internet connection"], ans:2,
    exp:"A bug is an error in code that causes unexpected behavior. The term originated from a real moth found in a Harvard computer in 1947 by Grace Hopper!" },
  { id:"tc6", cat:"Tech", ageGroup:"Teens", diff:"Medium",
    q:"What does GPS stand for?",
    opts:["General Positioning System","Global Positioning System","Geo-Pulse Satellite","Ground Point Sensor"], ans:1,
    exp:"GPS (Global Positioning System) uses a network of 24+ satellites to pinpoint your location anywhere on Earth within meters. Created by the US military." },

  // Adults
  { id:"tc7", cat:"Tech", ageGroup:"Adults", diff:"Hard",
    q:"What is the CAP theorem?",
    opts:["A caching strategy","A distributed system can only guarantee 2 of: Consistency, Availability, Partition tolerance","A microservice pattern","A SQL constraint"], ans:1,
    exp:"CAP says a distributed DB must sacrifice one property when a network partition occurs — e.g. MongoDB sacrifices availability, Cassandra sacrifices consistency." },
  { id:"tc8", cat:"Tech", ageGroup:"Adults", diff:"Hard",
    q:"What does RAG stand for in AI?",
    opts:["Rapid AI Generation","Retrieval-Augmented Generation","Random Attention Graph","Recursive Auto-regressor"], ans:1,
    exp:"RAG retrieves relevant documents and feeds them into an LLM for grounded, context-aware answers — reducing hallucinations." },
  { id:"tc9", cat:"Tech", ageGroup:"Adults", diff:"Hard",
    q:"What is LoRA in LLM fine-tuning?",
    opts:["A new attention architecture","Low-Rank Adaptation — fine-tune small rank-decomposition matrices instead of full weights","A data augmentation method","A RLHF variant"], ans:1,
    exp:"LoRA freezes pre-trained weights and adds pairs of low-rank matrices — reducing trainable params by ~10,000× vs full fine-tuning." },
];

// ── Constants ──────────────────────────────────────────────────────────────────
type AgeGroup = "All" | "Kids" | "Teens" | "Adults";
const AGE_GROUPS: AgeGroup[] = ["All", "Kids", "Teens", "Adults"];
const AGE_ICONS: Record<string, string> = { All: "🌟", Kids: "🧒", Teens: "🎒", Adults: "👤" };
const AGE_COLORS: Record<string, string> = { All: "#a855f7", Kids: "#4ade80", Teens: "#22d3ee", Adults: "#f472b6" };

const CATS = ["All", ...Array.from(new Set(ALL_QS.map((q) => q.cat))).sort()];
const CAT_ICONS: Record<string, string> = {
  "All": "🎮", "Science": "🔬", "Sports": "⚽", "History": "🏛️",
  "Geography": "🌍", "General Knowledge": "💡", "Tech": "💻",
};
const CAT_COLORS: Record<string, { text: string; badge: string }> = {
  "Science":          { text: "#34d399", badge: "#065f46" },
  "Sports":           { text: "#fbbf24", badge: "#92400e" },
  "History":          { text: "#c084fc", badge: "#6d28d9" },
  "Geography":        { text: "#60a5fa", badge: "#1e3a8a" },
  "General Knowledge":{ text: "#f97316", badge: "#9a3412" },
  "Tech":             { text: "#22d3ee", badge: "#0e7490" },
};
function catCol(c: string) { return CAT_COLORS[c] ?? { text: "#94a3b8", badge: "#334155" }; }

const DIFF_COLOR: Record<string, string> = { Easy: "#4ade80", Medium: "#fbbf24", Hard: "#f87171" };
const LABELS     = ["A", "B", "C", "D"];
const LABEL_COLS = ["#22d3ee", "#a855f7", "#4ade80", "#f472b6"];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function PlayPage() {
  const [cat,      setCat]      = useState<string>("All");
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("All");
  const [started,  setStart]    = useState(false);

  const [deck,    setDeck]    = useState<QuizQ[]>([]);
  const [qi,      setQi]      = useState(0);
  const [chosen,  setChosen]  = useState<number | null>(null);
  const [score,   setScore]   = useState(0);
  const [done,    setDone]    = useState(false);

  const filtered = (() => {
    let qs = ALL_QS;
    if (cat      !== "All") qs = qs.filter((q) => q.cat      === cat);
    if (ageGroup !== "All") qs = qs.filter((q) => q.ageGroup === ageGroup);
    return qs;
  })();

  const catCounts: Record<string, number> = {};
  {
    let base = ALL_QS;
    if (ageGroup !== "All") base = base.filter((q) => q.ageGroup === ageGroup);
    for (const q of base) catCounts[q.cat] = (catCounts[q.cat] ?? 0) + 1;
  }

  function start() {
    const d = shuffle(filtered).slice(0, 10);
    setDeck(d); setQi(0); setChosen(null); setScore(0); setDone(false);
    setStart(true);
  }

  function pick(idx: number) {
    if (chosen !== null) return;
    setChosen(idx);
    if (idx === deck[qi].ans) setScore((s) => s + 1);
  }

  function next() {
    if (qi + 1 >= deck.length) { setDone(true); return; }
    setQi((i) => i + 1);
    setChosen(null);
  }

  function restart() {
    setStart(false); setDone(false); setChosen(null);
  }

  const BG   = "#0b0b12";
  const CARD = "#111118";
  const BORD = "#1c1c2e";

  // ── Done screen ────────────────────────────────────────────────────────────
  if (done) {
    const pct = Math.round((score / deck.length) * 100);
    const grade = pct >= 80 ? "🏆 Champion!" : pct >= 60 ? "⭐ Great Job!" : pct >= 40 ? "📚 Keep Learning" : "🔁 Try Again";
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: BG }}>
        <div className="w-full max-w-md text-center">
          <div className="text-6xl mb-4">{pct >= 80 ? "🏆" : pct >= 60 ? "⭐" : pct >= 40 ? "📚" : "🔁"}</div>
          <h2 className="text-2xl font-black text-white mb-1">Round Complete!</h2>
          <p className="text-slate-400 mb-6">{grade}</p>
          <div className="text-6xl font-black font-mono mb-2" style={{ color: pct >= 60 ? "#4ade80" : "#fbbf24" }}>
            {score}/{deck.length}
          </div>
          <p className="text-slate-500 text-sm mb-8">{pct}% correct</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={start}
              className="px-6 py-2.5 rounded-xl text-sm font-black text-white"
              style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}>
              Play Again
            </button>
            <button onClick={restart}
              className="px-6 py-2.5 rounded-xl text-sm font-bold border"
              style={{ borderColor: "#22d3ee40", color: "#22d3ee", background: "#22d3ee0e" }}>
              Change Topic
            </button>
          </div>
          <Link href="/" className="block mt-6 text-xs text-slate-600 hover:text-slate-400 transition-colors">
            ← Back to videos
          </Link>
        </div>
      </div>
    );
  }

  // ── Active quiz ────────────────────────────────────────────────────────────
  if (started && deck.length > 0) {
    const q     = deck[qi];
    const col   = catCol(q.cat);
    const total = deck.length;

    return (
      <div className="min-h-screen" style={{ background: BG, color: "#e2e8f0" }}>
        <header className="sticky top-0 z-10 border-b px-4 py-3 flex items-center gap-3"
          style={{ borderColor: BORD, background: `${BG}f0`, backdropFilter: "blur(12px)" }}>
          <Link href="/" className="text-slate-500 hover:text-white text-sm transition-colors">←</Link>
          <span className="text-sm font-black text-white">
            {CAT_ICONS[q.cat] ?? "🎮"} {q.cat}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full font-bold"
            style={{ background: `${AGE_COLORS[q.ageGroup]}20`, color: AGE_COLORS[q.ageGroup], border: `1px solid ${AGE_COLORS[q.ageGroup]}40` }}>
            {AGE_ICONS[q.ageGroup]} {q.ageGroup}
          </span>
          <div className="flex-1" />
          <span className="text-xs font-bold font-mono px-2 py-1 rounded-lg"
            style={{ background: CARD, border: `1px solid ${BORD}`, color: "#94a3b8" }}>
            Q {qi + 1}/{total}
          </span>
          {score > 0 && (
            <span className="text-xs font-black px-2 py-1 rounded-lg"
              style={{ background: "#4ade8015", border: "1px solid #4ade8030", color: "#4ade80" }}>
              {score} ✓
            </span>
          )}
        </header>

        <div className="h-1 w-full" style={{ background: BORD }}>
          <div className="h-full transition-all duration-300" style={{
            width: `${((qi + (chosen !== null ? 1 : 0)) / total) * 100}%`,
            background: "linear-gradient(90deg,#7c3aed,#22d3ee)",
          }} />
        </div>

        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full"
              style={{ background: `${col.badge}25`, color: col.text, border: `1px solid ${col.badge}50` }}>
              {q.cat}
            </span>
            <span className="text-[11px] font-bold" style={{ color: DIFF_COLOR[q.diff] }}>
              {q.diff}
            </span>
          </div>

          <div className="rounded-2xl px-5 py-4 mb-4 border"
            style={{ background: "#0a0a16", borderColor: "#1a1a28" }}>
            <p className="text-[17px] font-bold text-white leading-snug mb-1">{q.q}</p>
            {chosen === null && <p className="text-[11px] text-slate-600">Pick the best answer</p>}
          </div>

          <div className="flex flex-col gap-2.5 mb-4">
            {q.opts.map((opt, i) => {
              const isCorrect = i === q.ans;
              const isChosen  = i === chosen;
              const revealed  = chosen !== null;
              const lc        = LABEL_COLS[i];
              let bg   = CARD;
              let bord = BORD;
              let txt  = "#94a3b8";
              if (revealed) {
                if (isCorrect)     { bg = "#4ade8012"; bord = "#4ade8060"; txt = "#4ade80"; }
                else if (isChosen) { bg = "#f8717112"; bord = "#f8717160"; txt = "#f87171"; }
                else               { bg = "#09090f";   bord = "#13131e";   txt = "#374151"; }
              }
              return (
                <button key={i} onClick={() => pick(i)} disabled={revealed}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                  style={{ background: bg, border: `1px solid ${bord}`, color: txt, cursor: revealed ? "default" : "pointer" }}>
                  <span className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[12px] font-black"
                    style={{
                      background: revealed ? "transparent" : `${lc}20`,
                      border: `1.5px solid ${revealed ? (isCorrect ? "#4ade80" : isChosen ? "#f87171" : "#1e1e2e") : lc}`,
                      color: revealed ? (isCorrect ? "#4ade80" : isChosen ? "#f87171" : "#374151") : lc,
                    }}>
                    {LABELS[i]}
                  </span>
                  <span className="text-[14px] font-semibold leading-snug flex-1">{opt}</span>
                  {revealed && isCorrect && <span className="text-lg">✓</span>}
                  {revealed && isChosen && !isCorrect && <span className="text-lg">✗</span>}
                </button>
              );
            })}
          </div>

          {chosen !== null && (
            <>
              <div className="rounded-xl px-4 py-3 text-[13px] leading-relaxed mb-4"
                style={{ background: "#091510", border: "1px solid #4ade8025", color: "#94a3b8" }}>
                <span className="font-bold text-green-400">Did you know? </span>{q.exp}
              </div>
              <button onClick={next}
                className="w-full py-3 rounded-xl text-[14px] font-black tracking-wide transition-all hover:opacity-85"
                style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff" }}>
                {qi + 1 < total ? "Next Question →" : "See Results →"}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Topic / age picker ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: BG, color: "#e2e8f0" }}>
      <header className="sticky top-0 z-10 border-b px-6 py-4 flex items-center gap-4"
        style={{ borderColor: BORD, background: `${BG}f0`, backdropFilter: "blur(12px)" }}>
        <Link href="/" className="text-slate-500 hover:text-white transition-colors text-sm">← Videos</Link>
        <span className="font-black text-white text-lg">🎮 Quiz Playground</span>
        <div className="flex-1" />
        <a href={channelConfig.youtubeSubscribeUrl} target="_blank" rel="noopener noreferrer"
          className="text-xs font-black px-3 py-1.5 rounded-lg text-white"
          style={{ background: "#dc2626" }}>
          Subscribe
        </a>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-3">🧠</div>
          <h1 className="text-3xl font-black text-white mb-2">Fun Quiz for Everyone!</h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Science, Sports, History, Geography, Tech and more. Pick your age group and topic!
          </p>
        </div>

        {/* Age Group picker */}
        <div className="mb-8">
          <p className="text-[11px] font-black tracking-widest uppercase text-slate-600 mb-3">Who&apos;s Playing?</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {AGE_GROUPS.map((ag) => {
              const active = ageGroup === ag;
              const col    = AGE_COLORS[ag];
              return (
                <button key={ag} onClick={() => { setAgeGroup(ag); setCat("All"); }}
                  className="flex flex-col items-center py-3 px-2 rounded-xl border transition-all"
                  style={active
                    ? { background: `${col}18`, borderColor: `${col}60`, color: col }
                    : { background: CARD, borderColor: BORD, color: "#64748b" }}>
                  <span className="text-2xl mb-1">{AGE_ICONS[ag]}</span>
                  <span className="text-xs font-black">{ag}</span>
                  {ag !== "All" && <span className="text-[10px] opacity-60 mt-0.5">
                    {ag === "Kids" ? "Ages 8–12" : ag === "Teens" ? "Ages 13–17" : "Ages 18+"}
                  </span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category picker */}
        <div className="mb-8">
          <p className="text-[11px] font-black tracking-widest uppercase text-slate-600 mb-3">Topic</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {CATS.map((c) => {
              const col    = catCol(c);
              const count  = c === "All" ? filtered.length : (catCounts[c] ?? 0);
              const active = cat === c;
              const icon   = CAT_ICONS[c] ?? "📌";
              return (
                <button key={c} onClick={() => setCat(c)}
                  className="flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left"
                  style={active
                    ? { background: c === "All" ? "#22d3ee15" : `${col.badge}25`,
                        borderColor: c === "All" ? "#22d3ee60" : `${col.badge}70`,
                        color: c === "All" ? "#22d3ee" : col.text }
                    : { background: CARD, borderColor: BORD, color: "#64748b" }}>
                  <span className="text-sm font-bold">{icon} {c}</span>
                  <span className="text-[11px] font-mono font-black opacity-60">{count}q</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Start button */}
        <div className="text-center">
          {filtered.length === 0 ? (
            <div className="py-8">
              <p className="text-slate-500 text-sm">No questions match this filter.</p>
              <p className="text-slate-600 text-xs mt-1">Try selecting a different age group or topic.</p>
            </div>
          ) : (
            <>
              <p className="text-slate-500 text-sm mb-4">
                {Math.min(filtered.length, 10)} questions ready
                {cat !== "All" && ` · ${CAT_ICONS[cat] ?? ""} ${cat}`}
                {ageGroup !== "All" && ` · ${AGE_ICONS[ageGroup]} ${ageGroup}`}
              </p>
              <button onClick={start}
                className="px-10 py-4 rounded-2xl text-base font-black text-white transition-all hover:scale-105 hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", boxShadow: "0 4px 24px rgba(168,85,247,0.3)" }}>
                Start Quiz →
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 flex items-center justify-between flex-wrap gap-3" style={{ borderTop: "1px solid #1a1a28" }}>
          <p className="text-[11px] text-slate-700">
            © {new Date().getFullYear()} QuizBytes Daily · quizbytes.dev
          </p>
          <div className="flex items-center gap-4 text-[11px] text-slate-700">
            <Link href="/about" className="hover:text-slate-400 transition-colors">About</Link>
            <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-400 transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
