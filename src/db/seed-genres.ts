import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { artists, albums, songs, puzzles, puzzleSongs } from "./schema";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient);

// ── Compact data format ─────────────────────────────────────────────────────
// Each artist: [name, normalized, country, genre, tags[], albums[], songs[]]
// Album: [name, year]
// Song: [name, albumIndex, popularity]

type ArtistEntry = {
  n: string; // name
  z: string; // normalized
  c: string; // country
  g: string; // primaryGenre
  t: string[]; // tags
  a: [string, number][]; // albums [name, year]
  s: [string, number, number][]; // songs [name, albumIdx, popularity]
};

const data: ArtistEntry[] = [
  // ═══════════════════════════════════════════════════════════════════════
  // 70s
  // ═══════════════════════════════════════════════════════════════════════
  { n:"Led Zeppelin", z:"led zeppelin", c:"UK", g:"classic rock", t:["70s","classic-rock"],
    a:[["Led Zeppelin",1969],["Led Zeppelin II",1969],["Led Zeppelin IV",1971],["Physical Graffiti",1975],["Houses of the Holy",1973]],
    s:[["The Ocean",4,10],["Ramble On",1,20],["The Rain Song",4,28],["Over the Hills and Far Away",4,35],["Kashmir",3,45],["Black Dog",2,55],["Whole Lotta Love",1,68],["Rock and Roll",2,75],["Immigrant Song",2,82],["Stairway to Heaven",2,96]]},
  { n:"Pink Floyd", z:"pink floyd", c:"UK", g:"classic rock", t:["70s","classic-rock"],
    a:[["The Dark Side of the Moon",1973],["Wish You Were Here",1975],["The Wall",1979],["Animals",1977]],
    s:[["Dogs",3,10],["Sheep",3,18],["Us and Them",0,28],["Have a Cigar",1,35],["Brain Damage",0,42],["Shine On You Crazy Diamond",1,50],["Money",0,60],["Wish You Were Here",1,72],["Comfortably Numb",2,85],["Another Brick in the Wall",2,95]]},
  { n:"Fleetwood Mac", z:"fleetwood mac", c:"UK", g:"classic rock", t:["70s","classic-rock","pop"],
    a:[["Fleetwood Mac",1975],["Rumours",1977],["Tusk",1979]],
    s:[["The Chain",1,15],["Gold Dust Woman",1,25],["Sara",2,32],["Rhiannon",0,42],["Landslide",0,52],["Little Lies",2,60],["Go Your Own Way",1,72],["Everywhere",2,80],["Dreams",1,92]]},
  { n:"The Eagles", z:"the eagles", c:"US", g:"classic rock", t:["70s","classic-rock"],
    a:[["Eagles",1972],["Desperado",1973],["Hotel California",1976],["The Long Run",1979]],
    s:[["Witchy Woman",0,12],["Peaceful Easy Feeling",0,20],["Tequila Sunrise",1,28],["Lyin' Eyes",1,38],["One of These Nights",1,48],["Life in the Fast Lane",2,58],["Desperado",1,68],["Take It Easy",0,78],["Hotel California",2,92]]},
  { n:"Queen", z:"queen", c:"UK", g:"classic rock", t:["70s","80s","classic-rock"],
    a:[["A Night at the Opera",1975],["News of the World",1977],["The Game",1980],["A Kind of Magic",1986]],
    s:[["Killer Queen",0,12],["Somebody to Love",0,22],["Fat Bottomed Girls",1,30],["Under Pressure",2,40],["Radio Ga Ga",3,48],["Another One Bites the Dust",2,58],["Don't Stop Me Now",0,68],["We Will Rock You",1,78],["We Are the Champions",1,85],["Bohemian Rhapsody",0,96]]},
  { n:"David Bowie", z:"david bowie", c:"UK", g:"classic rock", t:["70s","80s","classic-rock"],
    a:[["The Rise and Fall of Ziggy Stardust",1972],["Aladdin Sane",1973],["Let's Dance",1983],["Heroes",1977]],
    s:[["Moonage Daydream",0,10],["Rebel Rebel",1,22],["Ashes to Ashes",3,30],["The Jean Genie",1,38],["Modern Love",2,45],["Golden Years",0,52],["Starman",0,62],["Heroes",3,72],["Let's Dance",2,82],["Ziggy Stardust",0,88]]},
  { n:"Elton John", z:"elton john", c:"UK", g:"pop", t:["70s","pop","classic-rock"],
    a:[["Goodbye Yellow Brick Road",1973],["Captain Fantastic",1975],["Honky Château",1972],["Too Low for Zero",1983]],
    s:[["Saturday Night's Alright for Fighting",0,12],["Philadelphia Freedom",1,22],["Daniel",2,30],["I'm Still Standing",3,40],["Don't Let the Sun Go Down on Me",0,50],["Bennie and the Jets",0,58],["Crocodile Rock",2,68],["Tiny Dancer",0,78],["Rocket Man",1,85],["Your Song",0,92]]},
  { n:"Stevie Wonder", z:"stevie wonder", c:"US", g:"pop", t:["70s","pop"],
    a:[["Talking Book",1972],["Innervisions",1973],["Songs in the Key of Life",1976],["Hotter than July",1980]],
    s:[["Living for the City",1,12],["Boogie On Reggae Woman",1,22],["Sir Duke",2,32],["Higher Ground",1,42],["Signed, Sealed, Delivered",0,50],["I Just Called to Say I Love You",3,60],["You Are the Sunshine of My Life",0,70],["I Wish",2,78],["Isn't She Lovely",2,85],["Superstition",0,92]]},
  { n:"Boston", z:"boston", c:"US", g:"classic rock", t:["70s","classic-rock"],
    a:[["Boston",1976],["Don't Look Back",1978]],
    s:[["Smokin'",0,12],["Rock and Roll Band",0,22],["Hitch a Ride",0,30],["A Man I'll Never Be",1,38],["Peace of Mind",0,50],["Don't Look Back",1,62],["Foreplay/Long Time",0,72],["More Than a Feeling",0,92]]},
  { n:"Foreigner", z:"foreigner", c:"US", g:"classic rock", t:["70s","80s","classic-rock"],
    a:[["Foreigner",1977],["Double Vision",1978],["4",1981],["Agent Provocateur",1984]],
    s:[["Dirty White Boy",1,10],["Urgent",2,22],["Double Vision",1,30],["Head Games",1,38],["Cold as Ice",0,48],["Hot Blooded",0,58],["Juke Box Hero",2,68],["Waiting for a Girl Like You",2,78],["I Want to Know What Love Is",3,92]]},
  { n:"Journey", z:"journey", c:"US", g:"classic rock", t:["70s","80s","classic-rock"],
    a:[["Infinity",1978],["Escape",1981],["Frontiers",1983]],
    s:[["Wheel in the Sky",0,12],["Lovin', Touchin', Squeezin'",0,22],["Any Way You Want It",1,32],["Stone in Love",1,40],["Faithfully",2,50],["Separate Ways",2,60],["Open Arms",1,72],["Who's Crying Now",1,80],["Don't Stop Believin'",1,96]]},
  { n:"Heart", z:"heart", c:"US", g:"classic rock", t:["70s","80s","classic-rock"],
    a:[["Dreamboat Annie",1975],["Little Queen",1977],["Heart",1985],["Bad Animals",1987]],
    s:[["Straight On",1,10],["Magic Man",0,22],["Crazy on You",0,32],["What About Love",2,42],["Never",2,50],["These Dreams",2,58],["Alone",3,68],["Barracuda",1,82]]},
  { n:"Lynyrd Skynyrd", z:"lynyrd skynyrd", c:"US", g:"classic rock", t:["70s","classic-rock"],
    a:[["Pronounced",1973],["Second Helping",1974],["Nuthin' Fancy",1975]],
    s:[["That Smell",2,10],["The Ballad of Curtis Loew",1,20],["Gimme Three Steps",0,30],["Call Me the Breeze",1,42],["What's Your Name",2,52],["Tuesday's Gone",0,62],["Simple Man",0,72],["Sweet Home Alabama",1,85],["Free Bird",0,95]]},
  { n:"ZZ Top", z:"zz top", c:"US", g:"classic rock", t:["70s","80s","classic-rock"],
    a:[["Tres Hombres",1973],["Eliminator",1983],["Afterburner",1985]],
    s:[["Beer Drinkers & Hell Raisers",0,10],["Tush",0,22],["Legs",1,35],["Sleeping Bag",2,42],["Gimme All Your Lovin'",1,55],["La Grange",0,68],["Sharp Dressed Man",1,82]]},
  { n:"AC/DC", z:"acdc", c:"AU", g:"classic rock", t:["70s","80s","classic-rock"],
    a:[["High Voltage",1976],["Highway to Hell",1979],["Back in Black",1980],["For Those About to Rock",1981]],
    s:[["Dirty Deeds Done Dirt Cheap",0,10],["It's a Long Way to the Top",0,18],["For Those About to Rock",3,28],["T.N.T.",0,38],["You Shook Me All Night Long",2,50],["Highway to Hell",1,62],["Thunderstruck",2,72],["Back in Black",2,85]]},
  { n:"Bee Gees", z:"bee gees", c:"UK", g:"pop", t:["70s","pop"],
    a:[["Saturday Night Fever",1977],["Spirits Having Flown",1979],["Main Course",1975]],
    s:[["Jive Talkin'",2,12],["How Deep Is Your Love",0,25],["More Than a Woman",0,35],["You Should Be Dancing",2,45],["Tragedy",1,55],["Night Fever",0,68],["Stayin' Alive",0,90]]},
  { n:"Blondie", z:"blondie", c:"US", g:"pop", t:["70s","80s","pop"],
    a:[["Parallel Lines",1978],["Eat to the Beat",1979],["Autoamerican",1980]],
    s:[["Atomic",1,12],["Rapture",2,22],["The Tide Is High",2,32],["One Way or Another",0,45],["Call Me",0,60],["Heart of Glass",0,82]]},
  { n:"Tom Petty", z:"tom petty", c:"US", g:"classic rock", t:["70s","80s","classic-rock"],
    a:[["Damn the Torpedoes",1979],["Full Moon Fever",1989],["Southern Accents",1985],["Wildflowers",1994]],
    s:[["Breakdown",0,10],["Don't Do Me Like That",0,20],["The Waiting",0,28],["Refugee",0,38],["I Won't Back Down",1,48],["Learning to Fly",1,58],["Mary Jane's Last Dance",3,68],["Runnin' Down a Dream",1,78],["American Girl",0,85],["Free Fallin'",1,95]]},
  { n:"Bruce Springsteen", z:"bruce springsteen", c:"US", g:"classic rock", t:["70s","80s","classic-rock"],
    a:[["Born to Run",1975],["Darkness on the Edge of Town",1978],["Born in the U.S.A.",1984],["The River",1980]],
    s:[["Badlands",1,10],["The River",3,20],["Thunder Road",0,30],["Hungry Heart",3,38],["Glory Days",2,48],["Dancing in the Dark",2,58],["Born to Run",0,72],["Born in the U.S.A.",2,85]]},
  { n:"Billy Joel", z:"billy joel", c:"US", g:"pop", t:["70s","80s","pop","classic-rock"],
    a:[["The Stranger",1977],["52nd Street",1978],["Glass Houses",1980],["An Innocent Man",1983]],
    s:[["Movin' Out",0,10],["She's Always a Woman",0,20],["Scenes from an Italian Restaurant",0,28],["My Life",1,38],["You May Be Right",2,48],["It's Still Rock and Roll to Me",2,55],["Uptown Girl",3,65],["Just the Way You Are",0,75],["Piano Man",0,92]]},

  // ═══════════════════════════════════════════════════════════════════════
  // 90s
  // ═══════════════════════════════════════════════════════════════════════
  { n:"Nirvana", z:"nirvana", c:"US", g:"grunge", t:["90s"],
    a:[["Nevermind",1991],["In Utero",1993],["Bleach",1989]],
    s:[["Drain You",0,10],["In Bloom",0,20],["Rape Me",1,28],["All Apologies",1,38],["Heart-Shaped Box",1,48],["About a Girl",2,55],["Come as You Are",0,65],["Lithium",0,78],["Smells Like Teen Spirit",0,96]]},
  { n:"Pearl Jam", z:"pearl jam", c:"US", g:"grunge", t:["90s"],
    a:[["Ten",1991],["Vs.",1993],["Vitalogy",1994]],
    s:[["Oceans",0,10],["Why Go",0,18],["Daughter",1,28],["Rearviewmirror",1,38],["Better Man",2,48],["Even Flow",0,58],["Jeremy",0,68],["Black",0,78],["Alive",0,90]]},
  { n:"Soundgarden", z:"soundgarden", c:"US", g:"grunge", t:["90s"],
    a:[["Badmotorfinger",1991],["Superunknown",1994],["Down on the Upside",1996]],
    s:[["Rusty Cage",0,10],["Outshined",0,22],["Fell on Black Days",1,32],["Burden in My Hand",2,42],["My Wave",1,50],["Spoonman",1,60],["The Day I Tried to Live",1,70],["Black Hole Sun",1,88]]},
  { n:"Alice in Chains", z:"alice in chains", c:"US", g:"grunge", t:["90s"],
    a:[["Facelift",1990],["Dirt",1992],["Jar of Flies",1994]],
    s:[["Them Bones",1,10],["Dam That River",1,20],["Angry Chair",1,28],["No Excuses",2,38],["Down in a Hole",1,48],["Would?",1,58],["Rooster",1,68],["Man in the Box",0,82]]},
  { n:"Stone Temple Pilots", z:"stone temple pilots", c:"US", g:"grunge", t:["90s"],
    a:[["Core",1992],["Purple",1994],["Tiny Music",1996]],
    s:[["Wicked Garden",0,10],["Creep",0,20],["Big Empty",1,30],["Vasoline",1,40],["Trippin' on a Hole in a Paper Heart",2,48],["Interstate Love Song",1,58],["Sex Type Thing",0,68],["Plush",0,85]]},
  { n:"Smashing Pumpkins", z:"smashing pumpkins", c:"US", g:"alternative", t:["90s"],
    a:[["Siamese Dream",1993],["Mellon Collie",1995],["Gish",1991]],
    s:[["Rhinoceros",2,8],["Soma",0,18],["Disarm",0,28],["Rocket",0,35],["Zero",1,42],["Tonight Tonight",1,52],["Cherub Rock",0,62],["Today",0,72],["Bullet with Butterfly Wings",1,82],["1979",1,92]]},
  { n:"Green Day", z:"green day", c:"US", g:"punk", t:["90s"],
    a:[["Dookie",1994],["Insomniac",1995],["Nimrod",1997],["American Idiot",2004]],
    s:[["She",0,10],["Hitchin' a Ride",2,18],["Brain Stew",1,28],["Welcome to Paradise",0,38],["Good Riddance",2,48],["Longview",0,55],["When I Come Around",0,65],["Boulevard of Broken Dreams",3,78],["Basket Case",0,88]]},
  { n:"Oasis", z:"oasis", c:"UK", g:"britpop", t:["90s"],
    a:[["Definitely Maybe",1994],["(What's the Story) Morning Glory?",1995],["Be Here Now",1997]],
    s:[["Supersonic",0,10],["Cigarettes & Alcohol",0,20],["Live Forever",0,32],["Some Might Say",1,40],["Champagne Supernova",1,50],["Stand by Me",2,58],["Don't Look Back in Anger",1,72],["Wonderwall",1,92]]},
  { n:"Radiohead", z:"radiohead", c:"UK", g:"alternative", t:["90s"],
    a:[["Pablo Honey",1993],["The Bends",1995],["OK Computer",1997]],
    s:[["My Iron Lung",1,8],["Just",1,18],["Lucky",2,28],["No Surprises",2,38],["Fake Plastic Trees",1,48],["High and Dry",1,58],["Karma Police",2,70],["Paranoid Android",2,80],["Creep",0,92]]},
  { n:"Red Hot Chili Peppers", z:"red hot chili peppers", c:"US", g:"alternative", t:["90s"],
    a:[["Blood Sugar Sex Magik",1991],["Californication",1999],["One Hot Minute",1995]],
    s:[["Breaking the Girl",0,10],["My Friends",2,20],["Aeroplane",2,28],["Soul to Squeeze",0,38],["Scar Tissue",1,48],["Californication",1,58],["Otherside",1,65],["Under the Bridge",0,78],["Give It Away",0,88]]},
  { n:"Weezer", z:"weezer", c:"US", g:"alternative", t:["90s"],
    a:[["Blue Album",1994],["Pinkerton",1996],["Green Album",2001]],
    s:[["The World Has Turned",0,8],["El Scorcho",1,18],["My Name Is Jonas",0,28],["The Sweater Song",0,38],["Hash Pipe",2,48],["Island in the Sun",2,55],["Say It Ain't So",0,68],["Buddy Holly",0,82]]},
  { n:"No Doubt", z:"no doubt", c:"US", g:"ska punk", t:["90s","pop"],
    a:[["Tragic Kingdom",1995],["Return of Saturn",2000],["Rock Steady",2001]],
    s:[["Excuse Me Mr.",0,10],["Sunday Morning",0,20],["Spiderweb",0,30],["Hella Good",2,40],["Underneath It All",2,48],["It's My Life",0,55],["Just a Girl",0,68],["Don't Speak",0,88]]},
  { n:"Alanis Morissette", z:"alanis morissette", c:"CA", g:"alternative", t:["90s"],
    a:[["Jagged Little Pill",1995],["Supposed Former Infatuation Junkie",1998]],
    s:[["All I Really Want",0,10],["Head Over Feet",0,22],["Hand in My Pocket",0,32],["Uninvited",1,42],["Thank U",1,50],["Ironic",0,62],["You Learn",0,72],["You Oughta Know",0,88]]},
  { n:"Counting Crows", z:"counting crows", c:"US", g:"alternative", t:["90s"],
    a:[["August and Everything After",1993],["Recovering the Satellites",1996]],
    s:[["Rain King",0,10],["Anna Begins",0,20],["Angels of the Silences",1,30],["A Long December",1,42],["Accidentally in Love",0,55],["Round Here",0,68],["Mr. Jones",0,85]]},
  { n:"Third Eye Blind", z:"third eye blind", c:"US", g:"alternative", t:["90s"],
    a:[["Third Eye Blind",1997],["Blue",1999]],
    s:[["Graduate",0,10],["Losing a Whole Year",0,20],["Narcolepsy",1,28],["Never Let You Go",1,38],["How's It Going to Be",0,52],["Jumper",0,68],["Semi-Charmed Life",0,88]]},
  { n:"Goo Goo Dolls", z:"goo goo dolls", c:"US", g:"alternative", t:["90s"],
    a:[["A Boy Named Goo",1995],["Dizzy Up the Girl",1998]],
    s:[["Broadway",1,10],["Slide",1,22],["Black Balloon",1,32],["Here Is Gone",1,42],["Name",0,55],["Iris",1,82]]},
  { n:"Sublime", z:"sublime", c:"US", g:"ska punk", t:["90s"],
    a:[["40oz. to Freedom",1992],["Sublime",1996]],
    s:[["Garden Grove",1,10],["Doin' Time",1,22],["Wrong Way",1,32],["Badfish",0,42],["What I Got",1,55],["Santeria",1,78]]},
  { n:"Foo Fighters", z:"foo fighters", c:"US", g:"alternative", t:["90s"],
    a:[["Foo Fighters",1995],["The Colour and the Shape",1997],["There Is Nothing Left to Lose",1999]],
    s:[["For All the Cows",0,8],["I'll Stick Around",0,18],["This Is a Call",0,28],["My Hero",1,38],["Monkey Wrench",1,48],["Big Me",0,55],["Learn to Fly",2,65],["Everlong",1,82]]},
  { n:"Blink-182", z:"blink 182", c:"US", g:"punk", t:["90s"],
    a:[["Dude Ranch",1997],["Enema of the State",1999],["Take Off Your Pants and Jacket",2001]],
    s:[["Dammit",0,10],["Going Away to College",1,22],["Adam's Song",1,32],["I Miss You",2,42],["The Rock Show",2,52],["What's My Age Again?",1,62],["All the Small Things",1,82]]},
  { n:"Rage Against the Machine", z:"rage against the machine", c:"US", g:"alternative", t:["90s"],
    a:[["Rage Against the Machine",1992],["Evil Empire",1996],["The Battle of Los Angeles",1999]],
    s:[["Bombtrack",0,10],["Freedom",0,20],["Sleep Now in the Fire",2,28],["Testify",2,38],["Guerrilla Radio",2,48],["Know Your Enemy",0,55],["Bulls on Parade",1,68],["Killing in the Name",0,88]]},

  // ═══════════════════════════════════════════════════════════════════════
  // Pop
  // ═══════════════════════════════════════════════════════════════════════
  { n:"Michael Jackson", z:"michael jackson", c:"US", g:"pop", t:["80s","pop"],
    a:[["Off the Wall",1979],["Thriller",1982],["Bad",1987],["Dangerous",1991]],
    s:[["Wanna Be Startin' Somethin'",1,10],["Rock with You",0,20],["The Way You Make Me Feel",2,30],["Bad",2,40],["Smooth Criminal",2,48],["Black or White",3,55],["Man in the Mirror",2,65],["Beat It",1,78],["Billie Jean",1,88],["Thriller",1,95]]},
  { n:"Madonna", z:"madonna", c:"US", g:"pop", t:["80s","pop"],
    a:[["Madonna",1983],["Like a Virgin",1984],["True Blue",1986],["Ray of Light",1998]],
    s:[["Lucky Star",0,10],["Borderline",0,20],["Open Your Heart",2,28],["Papa Don't Preach",2,38],["Frozen",3,45],["Express Yourself",2,52],["Vogue",2,62],["Material Girl",1,72],["Like a Prayer",2,82],["Like a Virgin",1,90]]},
  { n:"Whitney Houston", z:"whitney houston", c:"US", g:"pop", t:["80s","pop"],
    a:[["Whitney Houston",1985],["Whitney",1987],["The Bodyguard",1992]],
    s:[["How Will I Know",0,12],["Saving All My Love for You",0,22],["So Emotional",1,32],["The Greatest Love of All",0,42],["I'm Every Woman",2,52],["I Wanna Dance with Somebody",1,65],["I Will Always Love You",2,92]]},
  { n:"Prince", z:"prince", c:"US", g:"pop", t:["80s","pop"],
    a:[["1999",1982],["Purple Rain",1984],["Sign o' the Times",1987],["Batman",1989]],
    s:[["I Would Die 4 U",1,10],["Raspberry Beret",1,20],["Batdance",3,28],["Sign o' the Times",2,35],["Little Red Corvette",0,45],["Kiss",2,55],["Let's Go Crazy",1,65],["1999",0,75],["When Doves Cry",1,85],["Purple Rain",1,95]]},
  { n:"Phil Collins", z:"phil collins", c:"UK", g:"pop", t:["80s","pop"],
    a:[["Face Value",1981],["Hello, I Must Be Going!",1982],["No Jacket Required",1985],["...But Seriously",1989]],
    s:[["I Don't Care Anymore",1,10],["You Can't Hurry Love",1,22],["Easy Lover",2,32],["One More Night",2,40],["Sussudio",2,48],["Against All Odds",1,58],["Another Day in Paradise",3,68],["In the Air Tonight",0,85]]},
  { n:"Cyndi Lauper", z:"cyndi lauper", c:"US", g:"pop", t:["80s","pop"],
    a:[["She's So Unusual",1983],["True Colors",1986]],
    s:[["She Bop",0,10],["All Through the Night",0,22],["The Goonies 'R' Good Enough",0,30],["True Colors",1,42],["Time After Time",0,58],["Girls Just Want to Have Fun",0,88]]},
  { n:"Duran Duran", z:"duran duran", c:"UK", g:"pop", t:["80s","pop"],
    a:[["Rio",1982],["Seven and the Ragged Tiger",1983],["Notorious",1986]],
    s:[["Planet Earth",0,10],["Save a Prayer",0,20],["The Reflex",1,30],["A View to a Kill",1,40],["Notorious",2,48],["Ordinary World",2,58],["Rio",0,68],["Hungry Like the Wolf",0,82]]},
  { n:"The Police", z:"the police", c:"UK", g:"pop", t:["80s","pop","classic-rock"],
    a:[["Outlandos d'Amour",1978],["Reggatta de Blanc",1979],["Synchronicity",1983]],
    s:[["Wrapped Around Your Finger",2,10],["Can't Stand Losing You",0,20],["King of Pain",2,30],["Don't Stand So Close to Me",1,40],["Message in a Bottle",1,50],["Roxanne",0,62],["Every Little Thing She Does Is Magic",1,72],["Every Breath You Take",2,90]]},
  { n:"U2", z:"u2", c:"IE", g:"classic rock", t:["80s","90s","classic-rock"],
    a:[["The Joshua Tree",1987],["Achtung Baby",1991],["War",1983],["The Unforgettable Fire",1984]],
    s:[["Sunday Bloody Sunday",2,10],["Pride",3,22],["New Year's Day",2,30],["Mysterious Ways",1,40],["One",1,50],["Beautiful Day",1,58],["Where the Streets Have No Name",0,68],["I Still Haven't Found What I'm Looking For",0,78],["With or Without You",0,90]]},
  { n:"Tears for Fears", z:"tears for fears", c:"UK", g:"pop", t:["80s","pop"],
    a:[["The Hurting",1983],["Songs from the Big Chair",1985],["The Seeds of Love",1989]],
    s:[["Mad World",0,10],["Change",0,22],["Head Over Heels",1,32],["Sowing the Seeds of Love",2,42],["Everybody Wants to Rule the World",1,62],["Shout",1,82]]},
  { n:"Depeche Mode", z:"depeche mode", c:"UK", g:"new wave", t:["80s"],
    a:[["Some Great Reward",1984],["Music for the Masses",1987],["Violator",1990]],
    s:[["Master and Servant",0,10],["Strangelove",1,22],["Behind the Wheel",1,30],["Policy of Truth",2,40],["Enjoy the Silence",2,55],["Personal Jesus",2,72],["Just Can't Get Enough",0,85]]},
  { n:"INXS", z:"inxs", c:"AU", g:"pop", t:["80s","pop"],
    a:[["Listen Like Thieves",1985],["Kick",1987],["X",1990]],
    s:[["What You Need",0,12],["Devil Inside",1,22],["Never Tear Us Apart",1,32],["Suicide Blonde",2,42],["Mystify",1,52],["New Sensation",1,65],["Need You Tonight",1,85]]},
  { n:"A-ha", z:"a-ha", c:"NO", g:"pop", t:["80s","pop"],
    a:[["Hunting High and Low",1985],["Scoundrel Days",1986]],
    s:[["Cry Wolf",1,10],["Hunting High and Low",0,22],["The Living Daylights",0,32],["The Sun Always Shines on T.V.",0,48],["Take On Me",0,92]]},
  { n:"Hall & Oates", z:"hall and oates", c:"US", g:"pop", t:["80s","pop"],
    a:[["Voices",1980],["Private Eyes",1981],["H2O",1982],["Big Bam Boom",1984]],
    s:[["Sara Smile",0,10],["Method of Modern Love",3,20],["Out of Touch",3,30],["You Make My Dreams",0,42],["Rich Girl",0,52],["Maneater",2,62],["I Can't Go for That",1,72],["Private Eyes",1,82],["Kiss on My List",0,88]]},
  { n:"Mariah Carey", z:"mariah carey", c:"US", g:"pop", t:["90s","pop"],
    a:[["Mariah Carey",1990],["Music Box",1993],["Daydream",1995],["Merry Christmas",1994]],
    s:[["Emotions",0,10],["Dreamlover",1,20],["Always Be My Baby",2,32],["Fantasy",2,42],["Hero",1,55],["One Sweet Day",2,65],["We Belong Together",2,72],["Vision of Love",0,80],["All I Want for Christmas Is You",3,96]]},
  { n:"Backstreet Boys", z:"backstreet boys", c:"US", g:"pop", t:["90s","pop"],
    a:[["Backstreet Boys",1996],["Millennium",1999],["Black & Blue",2000]],
    s:[["As Long as You Love Me",0,12],["Everybody (Backstreet's Back)",0,22],["Shape of My Heart",2,32],["Larger Than Life",1,42],["Show Me the Meaning",1,52],["Quit Playing Games",0,62],["I Want It That Way",1,88]]},
  { n:"TLC", z:"tlc", c:"US", g:"pop", t:["90s","pop"],
    a:[["Ooooooohhh... On the TLC Tip",1992],["CrazySexyCool",1994],["FanMail",1999]],
    s:[["Ain't 2 Proud 2 Beg",0,10],["Hat 2 da Back",0,20],["Unpretty",2,32],["Creep",1,42],["Diggin' on You",1,50],["No Scrubs",2,65],["Waterfalls",1,85]]},
  { n:"Spice Girls", z:"spice girls", c:"UK", g:"pop", t:["90s","pop"],
    a:[["Spice",1996],["Spiceworld",1997]],
    s:[["2 Become 1",0,10],["Say You'll Be There",0,22],["Stop",1,32],["Spice Up Your Life",1,42],["Wannabe",0,88]]},
];

async function seedGenres() {
  let created = 0;
  let skipped = 0;

  for (const d of data) {
    try {
      // Check if exists
      const existing = await db
        .select()
        .from(artists)
        .where(eq(artists.nameNormalized, d.z))
        .limit(1);

      if (existing.length > 0) {
        // Update existing puzzle with tags
        const existingPuzzles = await db
          .select()
          .from(puzzles)
          .where(eq(puzzles.artistId, existing[0].id));

        for (const p of existingPuzzles) {
          await db
            .update(puzzles)
            .set({ tags: d.t })
            .where(eq(puzzles.id, p.id));
        }
        console.log(`↻ ${d.n} — updated tags: [${d.t.join(", ")}]`);
        skipped++;
        continue;
      }

      // Create artist
      const [artist] = await db
        .insert(artists)
        .values({ name: d.n, nameNormalized: d.z, country: d.c, contentType: "music" })
        .returning();

      // Create albums
      const createdAlbums = [];
      for (const [name, year] of d.a) {
        const [album] = await db.insert(albums).values({ artistId: artist.id, name, year }).returning();
        createdAlbums.push(album);
      }

      // Create songs
      const createdSongs = [];
      for (const [name, albumIdx, popularity] of d.s) {
        const [song] = await db
          .insert(songs)
          .values({ name, artistId: artist.id, albumId: createdAlbums[albumIdx].id, popularity })
          .returning();
        createdSongs.push(song);
      }

      // Create puzzle
      const [puzzle] = await db
        .insert(puzzles)
        .values({
          mode: "artist",
          contentType: "music",
          artistId: artist.id,
          primaryGenre: d.g,
          tags: d.t,
          qualityScore: 85,
          published: true,
          approvedBy: "seed",
          approvedAt: new Date(),
        })
        .returning();

      // Link songs
      for (let i = 0; i < createdSongs.length; i++) {
        await db.insert(puzzleSongs).values({ puzzleId: puzzle.id, songId: createdSongs[i].id, displayOrder: i + 1 });
      }

      created++;
      console.log(`✓ ${d.n} (${createdSongs.length} songs) [${d.t.join(", ")}]`);
    } catch (err) {
      console.error(`✗ ${d.n}: ${err}`);
    }
  }

  // Tag existing hair metal puzzles that weren't in this seed
  console.log("\nUpdating existing untagged puzzles...");
  const untagged = await db
    .select()
    .from(puzzles)
    .where(eq(puzzles.published, true));

  let tagUpdated = 0;
  for (const p of untagged) {
    if (!p.tags || p.tags.length === 0) {
      const tags: string[] = [];
      if (p.primaryGenre === "hair metal") tags.push("hair-metal", "80s");
      else if (p.primaryGenre === "hard rock") tags.push("classic-rock", "80s");
      else tags.push(p.primaryGenre);

      if (tags.length > 0) {
        await db.update(puzzles).set({ tags }).where(eq(puzzles.id, p.id));
        tagUpdated++;
      }
    }
  }

  console.log(`\nDone! Created ${created} new puzzles, updated tags on ${skipped + tagUpdated} existing.`);
}

seedGenres().catch(console.error);
