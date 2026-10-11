import { mkdirSync, writeFileSync } from "node:fs";

const sourceUrl = "https://www.nhliberty.org/2026-candidate-endorsements/";
const explanationUrl = "https://nhdeservesbetter.com/free-staters";
const recordedDate = "2026-10-11";

const candidates = [
  [
    "James P. Gray",
    "James Gray",
    "james-gray",
    "Rochester",
    "",
    "6",
    "State Senator",
    "Republican"
  ],
  [
    "Daniel E. Innis",
    "Daniel Innis",
    "daniel-innis-8747",
    "Bradford",
    "",
    "7",
    "State Senator",
    "Republican"
  ],
  [
    "Keith Murphy",
    "Keith Murphy",
    "keith-murphy-10698",
    "Manchester",
    "",
    "16",
    "State Senator",
    "Republican"
  ],
  [
    "Victoria Sullivan",
    "Victoria Sullivan",
    "victoria-sullivan-11462",
    "Manchester",
    "",
    "18",
    "State Senator",
    "Republican"
  ],
  [
    "Tom Ploszaj",
    "Tom Ploszaj",
    "tom-ploszaj-9860",
    "Center Harbor",
    "Belknap",
    "1",
    "State Representative",
    "Republican"
  ],
  [
    "Scott Wallace",
    "Scott Wallace",
    "scott-wallace",
    "Meredith",
    "Belknap",
    "2",
    "State Representative",
    "Republican"
  ],
  [
    "Paul Rossi",
    "Paul Rossi",
    "paul-rossi",
    "Laconia",
    "Belknap",
    "5",
    "State Representative",
    "Republican"
  ],
  [
    "Paul A. Terry",
    "Paul Terry",
    "paul-terry",
    "Alton",
    "Belknap",
    "7",
    "State Representative",
    "Republican"
  ],
  [
    "Lisa M. Freeman",
    "Lisa Freeman",
    "lisa-freeman",
    "Tilton",
    "Belknap",
    "8",
    "State Representative",
    "Republican"
  ],
  [
    "Lino Avellani",
    "Lino Avellani",
    "lino-avellani",
    "Sanbornville",
    "Carroll",
    "4",
    "State Representative",
    "Republican"
  ],
  [
    "Mike Belcher",
    "Mike Belcher",
    "mike-belcher",
    "Sanbornville",
    "Carroll",
    "4",
    "State Representative",
    "Republican"
  ],
  [
    "Dallas Emery",
    "Dallas Emery, Jr",
    "dallas-emery-jr",
    "Ossipee",
    "Carroll",
    "5",
    "State Representative",
    "Republican"
  ],
  [
    "Tammy Garthwaite",
    "Tammy Simmons Garthwaite",
    "243675-tammy-garthwaite",
    "Wakefield",
    "Carroll",
    "8",
    "State Representative",
    "Republican"
  ],
  [
    "Colin Mitchell",
    "Colin Mitchell",
    "244337-colin-mitchell",
    "Wakefield",
    "Carroll",
    "8",
    "State Representative",
    "Republican"
  ],
  [
    "Rich Nalevanko",
    "Rich Nalevanko",
    "rich-nalevanko",
    "Alstead",
    "Cheshire",
    "9",
    "State Representative",
    "Republican"
  ],
  [
    "Sly Karasinski",
    "Sly Karasinski",
    "sly-karasinski-10037",
    "North Swanzey",
    "Cheshire",
    "10",
    "State Representative",
    "Republican"
  ],
  [
    "Matthew Santonastaso",
    "Matthew Santonastaso",
    "sos-2026-house-cheshire-13-matthew-santonastaso",
    "Jaffrey",
    "Cheshire",
    "13",
    "State Representative",
    "Republican"
  ],
  [
    "John B. Hunt",
    "John Hunt",
    "john-hunt-414",
    "Rindge",
    "Cheshire",
    "14",
    "State Representative",
    "Republican"
  ],
  [
    "Matthew Roach",
    "Matthew Roach",
    "matthew-roach",
    "Hinsdale",
    "Cheshire",
    "15",
    "State Representative",
    "Republican"
  ],
  [
    "Rita Mattson",
    "Rita Mattson",
    "rita-mattson-10034",
    "Dublin",
    "Cheshire",
    "18",
    "State Representative",
    "Republican"
  ],
  [
    "Jim Qualey",
    "James Qualey",
    "james-qualey-9875",
    "Rindge",
    "Cheshire",
    "18",
    "State Representative",
    "Republican"
  ],
  [
    "Sam Hoehn",
    "Sam Hoehn",
    "sam-hoehn",
    "Lancaster",
    "Coos",
    "1",
    "State Representative",
    "Republican"
  ],
  [
    "Amy Norris",
    "Amy Norris",
    "amy-norris",
    "Lancaster",
    "Coos",
    "1",
    "State Representative",
    "Republican"
  ],
  [
    "Arnold G. Davis",
    "Arnold Davis",
    "arnold-davis",
    "Berlin",
    "Coos",
    "2",
    "State Representative",
    "Republican"
  ],
  [
    "Seth King",
    "Seth King",
    "seth-king",
    "Whitefield",
    "Coos",
    "4",
    "State Representative",
    "Republican"
  ],
  [
    "Lori Korzen",
    "Lori Korzen",
    "lori-korzen",
    "Berlin",
    "Coos",
    "7",
    "State Representative",
    "Republican"
  ],
  [
    "Calvin Beaulier",
    "Calvin Beaulier",
    "calvin-beaulier",
    "Littleton",
    "Grafton",
    "1",
    "State Representative",
    "Republican"
  ],
  [
    "Marie Louise Bjelobrk",
    "Marie Bjelobrk",
    "marie-louise-bjelobrk",
    "North Haverhill",
    "Grafton",
    "5",
    "State Representative",
    "Republican"
  ],
  [
    "Donald McFarlane",
    "Donald McFarlane",
    "donald-mcfarlane-10913",
    "Orange",
    "Grafton",
    "18",
    "State Representative",
    "Republican"
  ],
  [
    "Deborah Kruzel",
    "Deborah Kruzel",
    "deborah-kruzel",
    "Pelham",
    "Hillsborough",
    "1",
    "State Representative",
    "Republican"
  ],
  [
    "Tom Mannion",
    "Tom Mannion",
    "tom-mannion",
    "Pelham",
    "Hillsborough",
    "1",
    "State Representative",
    "Republican"
  ],
  [
    "Diane Rogers",
    "Diane Rogers",
    "diane-rogers",
    "Pelham",
    "Hillsborough",
    "1",
    "State Representative",
    "Republican"
  ],
  [
    "Jeffrey F. Tenczar",
    "Jeffrey Tenczar",
    "jeffrey-tenczar",
    "Pelham",
    "Hillsborough",
    "1",
    "State Representative",
    "Republican"
  ],
  [
    "Brian Labrie",
    "Brian Labrie",
    "brian-labrie",
    "Bedford",
    "Hillsborough",
    "2",
    "State Representative",
    "Republican"
  ],
  [
    "Kristin Noble",
    "Kristin Noble",
    "kristin-noble",
    "Bedford",
    "Hillsborough",
    "2",
    "State Representative",
    "Republican"
  ],
  [
    "John Schneller",
    "John Schneller",
    "john-schneller",
    "Bedford",
    "Hillsborough",
    "2",
    "State Representative",
    "Republican"
  ],
  [
    "Daniel Richardson",
    "Daniel Richardson",
    "daniel-richardson",
    "Nashua",
    "Hillsborough",
    "6",
    "State Representative",
    "Republican"
  ],
  [
    "Bill Ohm",
    "Bill Ohm",
    "bill-ohm-968",
    "Nashua",
    "Hillsborough",
    "10",
    "State Representative",
    "Republican"
  ],
  [
    "Julie Miles",
    "Julie Miles",
    "julie-miles-11345",
    "Merrimack",
    "Hillsborough",
    "12",
    "State Representative",
    "Republican"
  ],
  [
    "Jeanine Notter",
    "Jeanine Notter",
    "jeanine-notter-639",
    "Merrimack",
    "Hillsborough",
    "12",
    "State Representative",
    "Republican"
  ],
  [
    "Wolfram von Schoen",
    "Wolfram Schoen",
    "wolfram-von-schoen",
    "Merrimack",
    "Hillsborough",
    "12",
    "State Representative",
    "Republican"
  ],
  [
    "Dillon Dumont",
    "Dillon Dumont",
    "dillon-dumont-11348",
    "Hudson",
    "Hillsborough",
    "13",
    "State Representative",
    "Republican"
  ],
  [
    "Cathy Kenny",
    "Cathy Kenny",
    "cathy-kenny",
    "Hudson",
    "Hillsborough",
    "13",
    "State Representative",
    "Republican"
  ],
  [
    "Andrew Prout",
    "Andrew Prout",
    "andrew-prout-8359",
    "Hudson",
    "Hillsborough",
    "13",
    "State Representative",
    "Republican"
  ],
  [
    "Jordan Ulery",
    "Jordan Ulery",
    "jordan-ulery-520",
    "Hudson",
    "Hillsborough",
    "13",
    "State Representative",
    "Republican"
  ],
  [
    "Bob Wherry",
    "Robert Wherry",
    "robert-wherry-10641",
    "Hudson",
    "Hillsborough",
    "13",
    "State Representative",
    "Republican"
  ],
  [
    "Raymond C. Peeples, Jr.",
    "Raymond Peeples",
    "raymond-peeples",
    "Litchfield",
    "Hillsborough",
    "14",
    "State Representative",
    "Republican"
  ],
  [
    "Mark McLean",
    "Mark McLean",
    "mark-mclean-859",
    "Manchester",
    "Hillsborough",
    "15",
    "State Representative",
    "Republican"
  ],
  [
    "Steven Kesselring",
    "Steven Kesselring",
    "steven-kesselring-11354",
    "Manchester",
    "Hillsborough",
    "18",
    "State Representative",
    "Republican"
  ],
  [
    "Matt Drew",
    "Matt Drew",
    "matt-drew-11355",
    "Manchester",
    "Hillsborough",
    "19",
    "State Representative",
    "Republican"
  ],
  [
    "Mickey Mullin",
    "Mickey Mullin",
    "mickey-mullin",
    "Manchester",
    "Hillsborough",
    "19",
    "State Representative",
    "Republican"
  ],
  [
    "Pierre M. Dupont",
    "Pierre Dupont",
    "pierre-dupont-10644",
    "Manchester",
    "Hillsborough",
    "20",
    "State Representative",
    "Republican"
  ],
  [
    "Brittany Ping",
    "Brittany Ping",
    "brittany-ping",
    "Manchester",
    "Hillsborough",
    "22",
    "State Representative",
    "Republican"
  ],
  [
    "Mary Murphy",
    "Mary Murphy",
    "mary-murphy-11360",
    "Francestown",
    "Hillsborough",
    "27",
    "State Representative",
    "Republican"
  ],
  [
    "Keith Erf",
    "Keith Erf",
    "keith-erf-9416",
    "Weare",
    "Hillsborough",
    "28",
    "State Representative",
    "Republican"
  ],
  [
    "Joe Alexander",
    "Joe Alexander",
    "joe-alexander-9165",
    "Goffstown",
    "Hillsborough",
    "29",
    "State Representative",
    "Republican"
  ],
  [
    "Henry R. Giasson III",
    "Henry Giasson",
    "henry-giasson-11363",
    "Goffstown",
    "Hillsborough",
    "29",
    "State Representative",
    "Republican"
  ],
  [
    "Sherri Reinfurt",
    "Sherri Reinfurt",
    "sherri-reinfurt-11364",
    "Goffstown",
    "Hillsborough",
    "29",
    "State Representative",
    "Republican"
  ],
  [
    "Diane Kelley",
    "Diane Kelley",
    "diane-kelley-9909",
    "Temple",
    "Hillsborough",
    "32",
    "State Representative",
    "Republican"
  ],
  [
    "Jim Kofalt",
    "Jim Kofalt",
    "jim-kofalt-9895",
    "Wilton",
    "Hillsborough",
    "32",
    "State Representative",
    "Republican"
  ],
  [
    "Shane Sirois",
    "Shane Sirois",
    "shane-sirois-10653",
    "New Ipswich",
    "Hillsborough",
    "32",
    "State Representative",
    "Republican"
  ],
  [
    "Liz Barbour",
    "Liz Barbour",
    "liz-barbour-10659",
    "Hollis",
    "Hillsborough",
    "35",
    "State Representative",
    "Republican"
  ],
  [
    "Diane Pauer",
    "Diane Pauer",
    "diane-pauer-9910",
    "Brookline",
    "Hillsborough",
    "36",
    "State Representative",
    "Republican"
  ],
  [
    "Adam Haverstock",
    "Adam Haverstock",
    "243738-adam-haverstock",
    "Hudson",
    "Hillsborough",
    "38",
    "State Representative",
    "Republican"
  ],
  [
    "Ted Trost",
    "Ted Trost",
    "ted-trost",
    "Hudson",
    "Hillsborough",
    "38",
    "State Representative",
    "Republican"
  ],
  [
    "Jon DiPietro",
    "Jon DiPietro",
    "sos-2026-house-hillsborough-39-jon-dipietro",
    "Manchester",
    "Hillsborough",
    "39",
    "State Representative",
    "Republican"
  ],
  [
    "Ryan Hebert",
    "Ryan Hebert",
    "ryan-hebert",
    "Manchester",
    "Hillsborough",
    "41",
    "State Representative",
    "Republican"
  ],
  [
    "Gerald Griffin",
    "Gerald Griffin",
    "gerald-griffin-8314",
    "Mont Vernon",
    "Hillsborough",
    "42",
    "State Representative",
    "Republican"
  ],
  [
    "Rob Lovett",
    "Rob Lovett",
    "rob-lovett",
    "Mont Vernon",
    "Hillsborough",
    "42",
    "State Representative",
    "Republican"
  ],
  [
    "Lisa C. M. Post",
    "Lisa Post",
    "lisa-post-9896",
    "Lyndeborough",
    "Hillsborough",
    "42",
    "State Representative",
    "Republican"
  ],
  [
    "Gary Daniels",
    "Gary Daniels",
    "gary-daniels-423",
    "Milford",
    "Hillsborough",
    "43",
    "State Representative",
    "Republican"
  ],
  [
    "Elizabeth Keenan",
    "Elizabeth Keenan",
    "242092-elizabeth-keenan",
    "Milford",
    "Hillsborough",
    "43",
    "State Representative",
    "Republican"
  ],
  [
    "Vanessa L. Sheehan",
    "Vanessa Sheehan",
    "vanessa-sheehan-9907",
    "Milford",
    "Hillsborough",
    "43",
    "State Representative",
    "Republican"
  ],
  [
    "Ross Berry",
    "Ross Berry",
    "ross-berry-9919",
    "Weare",
    "Hillsborough",
    "44",
    "State Representative",
    "Republican"
  ],
  [
    "Lisa Mazur",
    "Lisa Mazur",
    "lisa-mazur-10667",
    "Goffstown",
    "Hillsborough",
    "44",
    "State Representative",
    "Republican"
  ],
  [
    "Rick Devoid",
    "Rick Devoid",
    "rick-devoid",
    "Boscawen",
    "Merrimack",
    "1",
    "State Representative",
    "Republican"
  ],
  [
    "Gregory Hill",
    "Gregory Hill",
    "gregory-hill",
    "Northfield",
    "Merrimack",
    "2",
    "State Representative",
    "Republican"
  ],
  [
    "Michael Visconti",
    "Michael Visconti",
    "sos-2026-house-merrimack-3-michael-visconti",
    "Franklin",
    "Merrimack",
    "3",
    "State Representative",
    "Republican"
  ],
  [
    "Michael Moffett",
    "Michael Moffett",
    "michael-moffett",
    "Loudon",
    "Merrimack",
    "4",
    "State Representative",
    "Republican"
  ],
  [
    "Stephen Boyd",
    "Stephen Boyd",
    "stephen-boyd-9929",
    "Hooksett",
    "Merrimack",
    "10",
    "State Representative",
    "Republican"
  ],
  [
    "Pamela McMahon",
    "PAMELA MCMAHON",
    "244270-pamela-mcmahon",
    "Hooksett",
    "Merrimack",
    "10",
    "State Representative",
    "Republican"
  ],
  [
    "Yury Polozov",
    "Yury Polozov",
    "yury-polozov-10676",
    "Hooksett",
    "Merrimack",
    "10",
    "State Representative",
    "Republican"
  ],
  [
    "Thomas C. Walsh",
    "Thomas Walsh",
    "thomas-walsh-791",
    "Hooksett",
    "Merrimack",
    "10",
    "State Representative",
    "Republican"
  ],
  [
    "Matthew Pitaro",
    "Matthew Pitaro",
    "matthew-pitaro-9928",
    "Allenstown",
    "Merrimack",
    "11",
    "State Representative",
    "Republican"
  ],
  [
    "Peter L. Mehegan",
    "Peter Mehegan",
    "peter-mehegan-11382",
    "Pembroke",
    "Merrimack",
    "12",
    "State Representative",
    "Republican"
  ],
  [
    "Brian Seaworth",
    "Brian Seaworth",
    "brian-seaworth-944",
    "Pembroke",
    "Merrimack",
    "12",
    "State Representative",
    "Republican"
  ],
  [
    "Cyril Aures",
    "Cyril Aures",
    "cyril-aures-10677",
    "Chichester",
    "Merrimack",
    "13",
    "State Representative",
    "Republican"
  ],
  [
    "Clayton Wood",
    "Clayton Wood",
    "clayton-wood-10678",
    "Pittsfield",
    "Merrimack",
    "13",
    "State Representative",
    "Republican"
  ],
  [
    "James Thibault",
    "James Thibault",
    "james-thibault-10980",
    "Franklin",
    "Merrimack",
    "25",
    "State Representative",
    "Republican"
  ],
  [
    "Alvin B. See",
    "Alvin See",
    "alvin-see-10682",
    "Loudon",
    "Merrimack",
    "26",
    "State Representative",
    "Republican"
  ],
  [
    "Ray Plante",
    "Ray Plante",
    "raymond-plante-10121",
    "Dunbarton",
    "Merrimack",
    "27",
    "State Representative",
    "Republican"
  ],
  [
    "Vanessa Poulin",
    "Vanessa Poulin",
    "vanessa-poulin",
    "Epsom",
    "Merrimack",
    "27",
    "State Representative",
    "Republican"
  ],
  [
    "James Guzofski",
    "James Guzofski",
    "james-guzofski",
    "Northwood",
    "Rockingham",
    "1",
    "State Representative",
    "Republican"
  ],
  [
    "Paul Tudor",
    "Paul Tudor",
    "paul-tudor",
    "Northwood",
    "Rockingham",
    "1",
    "State Representative",
    "Republican"
  ],
  [
    "Jason Osborne",
    "Jason Osborne",
    "jason-osborne",
    "Auburn",
    "Rockingham",
    "2",
    "State Representative",
    "Republican"
  ],
  [
    "James Spillane",
    "James Spillane",
    "james-spillane",
    "Deerfield",
    "Rockingham",
    "2",
    "State Representative",
    "Republican"
  ],
  [
    "Cindy Bennett",
    "Cindy Bennett",
    "cindy-bennett",
    "Raymond",
    "Rockingham",
    "4",
    "State Representative",
    "Republican"
  ],
  [
    "Michael Drago",
    "Michael Drago",
    "michael-drago",
    "Raymond",
    "Rockingham",
    "4",
    "State Representative",
    "Republican"
  ],
  [
    "Brian Nadeau",
    "Brian Nadeau",
    "brian-nadeau",
    "Raymond",
    "Rockingham",
    "4",
    "State Representative",
    "Republican"
  ],
  [
    "Trevor Morse",
    "Trevor Morse",
    "244348-trevor-morse",
    "Epping",
    "Rockingham",
    "5",
    "State Representative",
    "Republican"
  ],
  [
    "Sayra Lynn DeVito",
    "Sayra DeVito",
    "sayra-devito",
    "Danville",
    "Rockingham",
    "8",
    "State Representative",
    "Republican"
  ],
  [
    "James Scamman",
    "James Scamman",
    "james-scamman",
    "Stratham",
    "Rockingham",
    "12",
    "State Representative",
    "Republican"
  ],
  [
    "Brandon Bach",
    "Brandon Bach",
    "brandon-bach",
    "Derry",
    "Rockingham",
    "13",
    "State Representative",
    "Republican"
  ],
  [
    "Anthony Henry",
    "Anthony Henry",
    "243714-anthony-henry",
    "Derry",
    "Rockingham",
    "13",
    "State Representative",
    "Republican"
  ],
  [
    "Erica Layon",
    "Erica Layon",
    "erica-layon-9935",
    "Derry",
    "Rockingham",
    "13",
    "State Representative",
    "Republican"
  ],
  [
    "David C. Love",
    "David Love",
    "david-love-8407",
    "Derry",
    "Rockingham",
    "13",
    "State Representative",
    "Republican"
  ],
  [
    "John Potucek",
    "John Potucek",
    "john-potucek-902",
    "Derry",
    "Rockingham",
    "13",
    "State Representative",
    "Republican"
  ],
  [
    "Pam Brown",
    "Pam Brown",
    "pam-brown-11407",
    "Kingston",
    "Rockingham",
    "14",
    "State Representative",
    "Republican"
  ],
  [
    "Kenneth L. Weyler",
    "Kenneth Weyler",
    "kenneth-weyler-422",
    "Kingston",
    "Rockingham",
    "14",
    "State Representative",
    "Republican"
  ],
  [
    "Ron Dunn",
    "Ron Dunn",
    "ron-dunn-10693",
    "Londonderry",
    "Rockingham",
    "16",
    "State Representative",
    "Republican"
  ],
  [
    "Jeffrey McGraw",
    "Jeffrey McGraw",
    "jeffrey-mcgraw",
    "Londonderry",
    "Rockingham",
    "16",
    "State Representative",
    "Republican"
  ],
  [
    "Sherman Packard",
    "Sherman Packard",
    "sherman-packard-425",
    "Londonderry",
    "Rockingham",
    "16",
    "State Representative",
    "Republican"
  ],
  [
    "Bob Lynn",
    "Bob Lynn",
    "bob-lynn-9937",
    "Windham",
    "Rockingham",
    "17",
    "State Representative",
    "Republican"
  ],
  [
    "Daniel Popovici-Muller",
    "Daniel Popovici-Muller",
    "daniel-popovici-muller-10697",
    "Windham",
    "Rockingham",
    "17",
    "State Representative",
    "Republican"
  ],
  [
    "Debra L. DeSimone",
    "Debra DeSimone",
    "debra-desimone-570",
    "Atkinson",
    "Rockingham",
    "18",
    "State Representative",
    "Republican"
  ],
  [
    "Robert Harb",
    "Robert Harb",
    "robert-harb-9293",
    "Plaistow",
    "Rockingham",
    "20",
    "State Representative",
    "Republican"
  ],
  [
    "Joe Sweeney",
    "Joe Sweeney",
    "joe-sweeney-779",
    "Salem",
    "Rockingham",
    "25",
    "State Representative",
    "Republican"
  ],
  [
    "Jess Edwards",
    "Jess Edwards",
    "jess-edwards-8392",
    "Auburn",
    "Rockingham",
    "31",
    "State Representative",
    "Republican"
  ],
  [
    "Melissa A. Litchfield",
    "Melissa Litchfield",
    "melissa-litchfield-9940",
    "Brentwood",
    "Rockingham",
    "32",
    "State Representative",
    "Republican"
  ],
  [
    "Julius F. Soti",
    "Julius Soti",
    "julius-soti-9936",
    "Windham",
    "Rockingham",
    "35",
    "State Representative",
    "Republican"
  ],
  [
    "JD Bernardy",
    "JD Bernardy",
    "jd-bernardy-9941",
    "South Hampton",
    "Rockingham",
    "36",
    "State Representative",
    "Republican"
  ],
  [
    "Linda McGrath",
    "Linda McGrath",
    "linda-mcgrath-11421",
    "Hampton",
    "Rockingham",
    "40",
    "State Representative",
    "Republican"
  ],
  [
    "Sue DeLemus",
    "Susan DeLemus",
    "sos-2026-house-strafford-1-sue-delemus",
    "Farmington",
    "Strafford",
    "1",
    "State Representative",
    "Republican"
  ],
  [
    "Glenn Bailey",
    "Glenn Bailey",
    "glenn-bailey",
    "Milton",
    "Strafford",
    "2",
    "State Representative",
    "Republican"
  ],
  [
    "Michael Granger",
    "Michael Granger",
    "michael-granger",
    "Milton Mills",
    "Strafford",
    "2",
    "State Representative",
    "Republican"
  ],
  [
    "Mark F. Racic",
    "Mark Racic",
    "mark-f-racic",
    "Milton",
    "Strafford",
    "2",
    "State Representative",
    "Republican"
  ],
  [
    "Susan G. DeRoy",
    "Susan DeRoy",
    "susan-deroy",
    "New Durham",
    "Strafford",
    "3",
    "State Representative",
    "Republican"
  ],
  [
    "JoAnne Hack",
    "JoAnne Hack",
    "joanne-hack",
    "Barrington",
    "Strafford",
    "4",
    "State Representative",
    "Republican"
  ],
  [
    "Tanya Rich",
    "Tanya Rich",
    "sos-2026-house-strafford-4-tanya-rich",
    "Strafford",
    "Strafford",
    "4",
    "State Representative",
    "Republican"
  ],
  [
    "Kurt Wuelper",
    "Kurt Wuelper",
    "242731-kurt-wuelper",
    "Strafford",
    "Strafford",
    "4",
    "State Representative",
    "Republican"
  ],
  [
    "David Walker",
    "David Walker",
    "david-walker-10716",
    "Rochester",
    "Strafford",
    "8",
    "State Representative",
    "Republican"
  ],
  [
    "Robert Qua",
    "Robert Qua",
    "244358-robert-qua",
    "Rochester",
    "Strafford",
    "9",
    "State Representative",
    "Republican"
  ],
  [
    "Samuel Farrington",
    "Samuel Farrington",
    "samuel-farrington",
    "Rochester",
    "Strafford",
    "19",
    "State Representative",
    "Republican"
  ],
  [
    "James Higginbottom",
    "James Higginbottom",
    "sos-2026-house-strafford-19-james-higginbottom",
    "Rochester",
    "Strafford",
    "19",
    "State Representative",
    "Republican"
  ],
  [
    "Skip Rollins",
    "Skip Rollins",
    "skip-rollins",
    "Newport",
    "Sullivan",
    "3",
    "State Representative",
    "Republican"
  ],
  [
    "Steven Smith",
    "Steven Smith",
    "steven-smith",
    "Charlestown",
    "Sullivan",
    "3",
    "State Representative",
    "Republican"
  ],
  [
    "Walter Spilsbury",
    "Walter Spilsbury",
    "walter-spilsbury",
    "Charlestown",
    "Sullivan",
    "3",
    "State Representative",
    "Republican"
  ],
  [
    "Ron Rule",
    "Ron Rule",
    "ron-rule",
    "Langdon",
    "Sullivan",
    "4",
    "State Representative",
    "Republican"
  ],
  [
    "George C. Grant",
    "George Grant",
    "george-grant",
    "Sunapee",
    "Sullivan",
    "5",
    "State Representative",
    "Republican"
  ],
  [
    "Emily Sandblade",
    "Emily Sandblade",
    "emily-sandblade",
    "Claremont",
    "Sullivan",
    "6",
    "State Representative",
    "Republican"
  ],
  [
    "Margaret M. Drye",
    "Margaret Drye",
    "margaret-drye",
    "Plainfield",
    "Sullivan",
    "7",
    "State Representative",
    "Republican"
  ],
  [
    "Catherine Peschke",
    "Catherine Peschke",
    "catherine-peschke",
    "Croydon",
    "Sullivan",
    "8",
    "State Representative",
    "Republican"
  ],
  [
    "Jonathan F. Stone",
    "Jonathan Stone",
    "242430-jonathan-stone",
    "Claremont",
    "Sullivan",
    "8",
    "State Representative",
    "Republican"
  ]
];

const sqlQuote = (value) => `'${String(value).replaceAll("'", "''")}'`;
const officeLabel = (office, county, district) =>
  office === "State Senator"
    ? `State Senate District ${district}`
    : `${office} in ${county} District ${district}`;

const targets = candidates.map(([sourceName, dbName, slug, city, county, district, office, party]) => {
  const statement = `New Hampshire Liberty Alliance endorsed ${sourceName} for ${officeLabel(office, county, district)} in the 2026 election cycle. Source: ${sourceUrl} Learn more about the Free State Aligned designation: ${explanationUrl}.`;
  const displayDistrict = office === "State Senator" ? `District ${district}` : `${county} ${district}`;
  return [sourceName, dbName, slug, city, county, district, office, party, displayDistrict, statement];
});

const values = targets
  .map((row) => `(${row.map(sqlQuote).join(", ")})`)
  .join(",\n    ");
const sql = `CREATE TABLE _nhla_2026_endorsement_targets (
  source_name TEXT NOT NULL,
  db_name TEXT NOT NULL,
  slug TEXT PRIMARY KEY,
  city TEXT,
  county TEXT,
  district_no TEXT,
  office TEXT,
  party TEXT,
  display_district TEXT,
  statement TEXT NOT NULL
);

INSERT INTO _nhla_2026_endorsement_targets (
  source_name, db_name, slug, city, county, district_no, office, party,
  display_district, statement
)
VALUES
    ${values};

UPDATE d1_people
SET is_free_state_aligned_2026 = 1,
    is_2026_candidate = CASE
      WHEN EXISTS (
        SELECT 1
        FROM d1_person_candidate_roles role
        WHERE role.person_id = d1_people.id
          AND role.election_year = 2026
          AND role.status = 'active'
      ) THEN 1
      ELSE is_2026_candidate
    END,
    updated_at = CURRENT_TIMESTAMP
WHERE slug IN (SELECT slug FROM _nhla_2026_endorsement_targets);

UPDATE organization_endorsements
SET candidate_name = (SELECT db_name FROM _nhla_2026_endorsement_targets targets WHERE targets.slug = organization_endorsements.candidate_slug_key),
    candidate_slug = candidate_slug_key,
    office = (SELECT office FROM _nhla_2026_endorsement_targets targets WHERE targets.slug = organization_endorsements.candidate_slug_key),
    district = (SELECT display_district FROM _nhla_2026_endorsement_targets targets WHERE targets.slug = organization_endorsements.candidate_slug_key),
    election_year = '2026',
    position = 'Free State Aligned',
    statement = CASE
      WHEN instr(COALESCE(statement, ''), ${sqlQuote(sourceUrl)}) > 0 THEN statement
      WHEN source = 'nhla-2026-rating' THEN
        (SELECT statement FROM _nhla_2026_endorsement_targets targets WHERE targets.slug = organization_endorsements.candidate_slug_key) || ' ' || statement
      ELSE (SELECT statement FROM _nhla_2026_endorsement_targets targets WHERE targets.slug = organization_endorsements.candidate_slug_key)
    END,
    date = COALESCE(NULLIF(date, ''), ${sqlQuote(recordedDate)}),
    status = 'published',
    source = ${sqlQuote(sourceUrl)},
    organization_website = 'https://www.nhliberty.org/',
    reviewed_by = 'admin',
    reviewed_at = CURRENT_TIMESTAMP,
    workflow_status = 'approved',
    workflow_updated_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE id IN (
  SELECT (
    SELECT e.id
    FROM organization_endorsements e
    WHERE e.organization_slug = 'new-hampshire-liberty-alliance'
      AND e.election_year = '2026'
      AND e.candidate_slug_key = targets.slug
      AND e.status = 'published'
    ORDER BY
      CASE
        WHEN e.source = ${sqlQuote(sourceUrl)} THEN 0
        WHEN e.position = 'Endorsed' THEN 1
        ELSE 2
      END,
      e.id
    LIMIT 1
  )
  FROM _nhla_2026_endorsement_targets targets
);

INSERT INTO organization_endorsements (
  organization_slug, organization_name, organization_website,
  candidate_name, candidate_slug, candidate_slug_key, office, district,
  election_year, position, statement, date, status, source,
  reviewed_by, reviewed_at, workflow_status, workflow_updated_at,
  created_at, updated_at
)
SELECT
  'new-hampshire-liberty-alliance', 'New Hampshire Liberty Alliance', 'https://www.nhliberty.org/',
  db_name, slug, slug, office, display_district,
  '2026', 'Free State Aligned', statement, ${sqlQuote(recordedDate)}, 'published', ${sqlQuote(sourceUrl)},
  'admin', CURRENT_TIMESTAMP, 'approved', CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM _nhla_2026_endorsement_targets targets
WHERE NOT EXISTS (
  SELECT 1
  FROM organization_endorsements e
  WHERE e.organization_slug = 'new-hampshire-liberty-alliance'
    AND e.election_year = '2026'
    AND e.candidate_slug_key = targets.slug
    AND e.status = 'published'
);

DROP TABLE _nhla_2026_endorsement_targets;
`;

const csvEscape = (value) => {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};
const auditHeader = [
  "source_name", "database_name", "candidate_slug", "city", "county", "district",
  "office", "party", "source_url", "explanation_url", "planned_action",
];
const auditRows = candidates.map(([sourceName, dbName, slug, city, county, district, office, party]) => [
  sourceName, dbName, slug, city, county, district, office, party, sourceUrl, explanationUrl,
  "Upsert explicit NHLA endorsement and set 2026 Free State Aligned flag",
]);

const verificationValues = candidates.map(([, , slug]) => `(${sqlQuote(slug)})`).join(",\n    ");
const verificationCte = `WITH targets(slug) AS (\n  VALUES\n    ${verificationValues}\n)`;
const verificationSql = `${verificationCte}
SELECT
  (SELECT COUNT(*) FROM targets) AS source_candidates,
  (SELECT COUNT(*) FROM d1_people p JOIN targets t ON t.slug = p.slug) AS matched_people,
  (SELECT COUNT(*) FROM d1_people p JOIN targets t ON t.slug = p.slug WHERE p.is_free_state_aligned_2026 = 1) AS aligned_people,
  (SELECT COUNT(DISTINCT e.candidate_slug_key)
     FROM organization_endorsements e JOIN targets t ON t.slug = e.candidate_slug_key
    WHERE e.organization_slug = 'new-hampshire-liberty-alliance'
      AND e.election_year = '2026'
      AND e.status = 'published'
      AND e.position = 'Free State Aligned'
      AND instr(COALESCE(e.statement, ''), ${sqlQuote(sourceUrl)}) > 0
      AND instr(COALESCE(e.statement, ''), ${sqlQuote(explanationUrl)}) > 0
  ) AS verified_endorsements;

${verificationCte}
SELECT t.slug AS failed_slug
FROM targets t
LEFT JOIN d1_people p ON p.slug = t.slug
WHERE p.id IS NULL
   OR p.is_free_state_aligned_2026 != 1
   OR NOT EXISTS (
     SELECT 1 FROM organization_endorsements e
     WHERE e.organization_slug = 'new-hampshire-liberty-alliance'
       AND e.election_year = '2026'
       AND e.status = 'published'
       AND e.position = 'Free State Aligned'
       AND e.candidate_slug_key = t.slug
       AND instr(COALESCE(e.statement, ''), ${sqlQuote(sourceUrl)}) > 0
       AND instr(COALESCE(e.statement, ''), ${sqlQuote(explanationUrl)}) > 0
   );
`;

const outputDir = new URL("../output/nhla-2026-candidate-endorsements/", import.meta.url);
mkdirSync(outputDir, { recursive: true });
writeFileSync(new URL("apply.sql", outputDir), sql);
writeFileSync(new URL("verify.sql", outputDir), verificationSql);
writeFileSync(
  new URL("audit.csv", outputDir),
  [auditHeader, ...auditRows].map((row) => row.map(csvEscape).join(",")).join("\n") + "\n",
);

console.log(`Wrote ${candidates.length} NHLA candidate endorsements.`);
