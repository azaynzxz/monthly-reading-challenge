import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const month4Data = [
    { day: 1, country: "Indonesia", title: "The Stone Son", wikiSearch: "Malin Kundang", text: "01\nI stood on the bustling port of Padang, watching trading ships come and go. I needed to find wealth to help my struggling village.\n\n02\nI boarded a large merchant ship and sailed for many years across rough seas. I worked hard and eventually became a wealthy captain with my own galleon.\n\n03\nA fierce storm forced my beautiful ship to dock at my old village. My elderly mother ran to greet me with tears in her eyes, but my chest tightened, and my face grew hot with embarrassment at her ragged clothes. I pushed her away, denying she was my mother.\n\n04\nShe fell to the sandy ground and raised her trembling hands to the dark sky. Suddenly, lightning struck, and my body grew cold and stiff as the curse took effect.\n\n05\nI transformed entirely into solid stone, which is a hard rock, bound forever to the shore. My frozen form warns everyone to never forget where they came from." },
    { day: 2, country: "Greece", title: "Labyrinth of the Minotaur", wikiSearch: "Minotaur", text: "01\nI stepped into the dark, twisting Labyrinth, which is a massive maze, beneath the palace of Crete. My goal was to defeat the terrible Minotaur and save my people.\n\n02\nI walked slowly through the cold, damp stone corridors, using a spool of golden thread to mark my path. Shadows danced on the walls, and the distant roar of the beast echoed through the dark tunnels.\n\n03\nSuddenly, the massive half-man, half-bull charged at me with heavy, thundering footsteps. My hands gripped my sword tightly, and my throat went completely dry as the monster swung its massive horns.\n\n04\nI dodged swiftly and struck a final, decisive blow. The beast fell heavily to the stone floor, and the oppressive silence rushed back into the maze.\n\n05\nI followed my golden thread back to the warm sunlight above. The victory taught me that careful planning is just as important as bravery in battle." },
    { day: 3, country: "Greece", title: "The Voyage of Odysseus", wikiSearch: "Odyssey", text: "01\nI stood on the wooden deck of my ship, staring at the endless blue horizon. My only desire was to return to my beloved home of Ithaca after a long and grueling war.\n\n02\nWe sailed past mysterious islands and faced dangerous mythological creatures. I had to guide my exhausted crew past the Sirens, whose enchanting songs tried to crash our vessel against jagged rocks.\n\n03\nWe then sailed straight into a terrifying storm sent by the angry sea gods. Giant, crashing waves swallowed my ship, and my lungs burned for air as I plunged into the freezing ocean.\n\n04\nI washed ashore on a sandy beach, completely alone but finally safely back in my homeland. I hid in a humble disguise to safely approach my own palace.\n\n05\nI reclaimed my home and my family after many long years. I realized that true endurance is not just physical strength, but an unbreakable connection to home." },
    { day: 4, country: "England", title: "A Victorian Heroine", wikiSearch: "Jane Eyre", text: "01\nI sat quietly in the cold, unloving house of my wealthy relatives, clutching a worn book. I promised myself I would gain independence and find a place where I truly belonged.\n\n02\nI traveled far away to become a governess, which is a private teacher, at the mysterious Thornfield Hall. I explored the grand, dark rooms and tried to understand my brooding employer, Mr. Rochester.\n\n03\nOn my wedding day, a terrible secret was finally revealed in the old church. My hands shook uncontrollably, and my stomach twisted into tight knots as I fled out into the freezing night rain.\n\n04\nI wandered across the harsh, windy moors until kind strangers offered me shelter and work. I finally found my inner strength and a steady income of my own.\n\n05\nI eventually returned to Thornfield on my own terms. The difficult journey taught me that self-respect and truth are far more valuable than wealth or comfort." },
    { day: 5, country: "Rome", title: "Trials of Cupid and Psyche", wikiSearch: "Cupid and Psyche", text: "01\nI lived in an invisible palace filled with magic, but I was forbidden to see my mysterious husband's face. I desperately needed to uncover the truth about the man I loved.\n\n02\nI traveled through dark valleys and climbed treacherous mountains to complete impossible tasks given by the goddess Venus. I gathered golden fleece and descended into the terrifying underworld.\n\n03\nI opened a forbidden box, hoping to take a tiny bit of divine beauty. A deadly, magical sleep immediately swept over me, and my eyelids grew heavy and completely shut.\n\n04\nMy husband, Cupid, found me and wiped the magical sleep from my face. He carried me swiftly up to the bright heavens to stand before the mighty gods.\n\n05\nI was granted immortality, which means living forever, and we were officially married. My trials proved that true love requires absolute trust and endless perseverance." },
    { day: 6, country: "Germany", title: "The Wild Man of the Woods", wikiSearch: "Iron John", text: "01\nI watched the strange, rust-colored man locked tightly inside the iron cage in my father's courtyard. My shiny golden ball had rolled into his cage, and I desperately wanted it back.\n\n02\nI secretly stole the heavy iron key from under my mother's pillow and unlocked the creaking door. The wild man grabbed me, and we fled deep into the dark, mysterious forest where I had to survive by guarding a magical, golden spring.\n\n03\nYears later, a fierce war threatened my kingdom, and I rode into the chaotic battlefield on a magnificent horse provided by the wild man. My heart pounded against my ribs, and my hands gripped the cold leather reins tightly as enemy arrows flew past my face.\n\n04\nI fought bravely and drove the invading enemies away, but I hid my true identity beneath my heavy iron helmet. My family praised the unknown knight, completely unaware that he was their long-lost son.\n\n05\nThe wild man's curse was finally broken, revealing him as a mighty and noble king. I learned that true strength is forged through hardship, discipline, and remaining loyal to those who guide us." },
    { day: 7, country: "United States", title: "The White Whale's Chase", wikiSearch: "Moby-Dick", text: "01\nI signed aboard the whaling ship Pequod, seeking adventure on the open ocean to escape my restless thoughts. The captain, Ahab, had only one obsessive goal: to hunt down the legendary, massive white whale that had previously taken his leg.\n\n02\nWe sailed completely around the globe, enduring fierce gales and dangerous whale hunts. We encountered other ships from different nations, but Ahab ignored their warnings, pushing us further into isolated and treacherous waters in his relentless pursuit.\n\n03\nSuddenly, the monstrous white whale breached the surface, its massive jaw crashing down upon our small wooden boats. I fell backward as the water churned violently, and my lungs gasped for salty air while the ship splintered into floating debris around me.\n\n04\nThe mighty whale dragged Ahab down into the dark, crushing depths of the sea. I floated completely alone on a wooden coffin for an entire day and night before a passing ship finally rescued me from the silent, empty ocean.\n\n05\nI returned to land as the sole survivor of the doomed and tragic voyage. The terrifying ordeal taught me that an obsessive desire for revenge will ultimately consume and destroy those who cannot let go of their anger." },
    { day: 8, country: "United States", title: "The Yellow Brick Road", wikiSearch: "The Wonderful Wizard of Oz", text: "01\nI stood completely shocked in the vibrant, colorful land of Oz after a terrifying tornado carried my farmhouse away from Kansas. My only goal was to find the great Wizard in the Emerald City so he could send me safely back home.\n\n02\nI walked along the bright yellow brick road and met a Scarecrow, a Tin Woodman, and a Cowardly Lion. We traveled through enchanted forests, crossed deep ravines, and fell asleep in a massive field of deadly poppies, which are bright red flowers that cause magical slumber.\n\n03\nWe entered the dark, frightening castle of the Wicked Witch of the West to steal her magical broomstick. My palms sweated profusely, and my knees knocked together as her terrifying winged monkeys swooped down from the dark, cloudy sky.\n\n04\nI accidentally threw a bucket of cold water onto the witch, and she shockingly melted away into nothing but a puddle. We returned to the Wizard, only to discover he was just an ordinary man hiding behind a big green curtain.\n\n05\nI clicked my magical silver shoes together three times and woke up safely in my own bed. The vivid journey reminded me that courage, brains, and a loving heart are qualities we already possess inside ourselves." },
    { day: 9, country: "England", title: "Down the Rabbit Hole", wikiSearch: "Alice's Adventures in Wonderland", text: "01\nI sat on the grassy riverbank feeling incredibly bored until a peculiar White Rabbit wearing a waistcoat ran past me. I jumped up and followed him down a deep, dark rabbit hole to see where he was rushing to.\n\n02\nI wandered through a strange, chaotic world where I drank magical potions that made me shrink and ate cakes that made me grow enormous. I attended a completely mad tea party with a Hatter, and I played croquet using live flamingos as mallets.\n\n03\nThe furious Queen of Hearts suddenly turned her angry gaze toward me during a ridiculous courtroom trial. My chest heaved rapidly, and my breath caught in my throat as she pointed her finger and screamed for the guards to cut off my head.\n\n04\nI confidently yelled back at the terrifying royals, realizing they were nothing but a deck of ordinary playing cards. The cards flew up into the air and showered down upon my face as I desperately swatted them away.\n\n05\nI woke up abruptly on the peaceful riverbank, brushing dry leaves from my face. This nonsensical adventure taught me to embrace my imagination while also appreciating the comforting logic and rules of the real world." },
    { day: 10, country: "England", title: "The Knight's Quest", wikiSearch: "The Faerie Queene", text: "01\nI was a young, untested knight wearing old, dented armor decorated with a red cross. The Faerie Queene assigned me a righteous mission to defeat a terrifying dragon and free a beautiful princess's royal parents.\n\n02\nI traveled through dark, gloomy forests and faced numerous deceitful monsters along the tricky path. I entered the dangerous House of Pride and fought a terrible giant, learning quickly that appearances are often magical illusions designed to lead heroes astray.\n\n03\nI finally confronted the massive, fire-breathing dragon near the scorched castle walls. Smoke filled my lungs, and scorching heat blistered my skin as the beast whipped its deadly, spiked tail toward my tired, battered shield.\n\n04\nI gathered the last ounce of my strength, raised my holy sword, and struck the dragon with a fatal blow. The monstrous serpent crashed to the ground, and the heavy, black skies immediately cleared, bathing the valley in pure, warm sunlight.\n\n05\nThe grateful king rewarded me, and I celebrated the hard-won peace with the lovely princess. The brutal trials proved that true holiness requires constant vigilance, and faith is the sharpest weapon against absolute evil." }
];

const dataPath = path.join(__dirname, '..', 'src', 'data');
const month4Dir = path.join(dataPath, 'month4');

if (!fs.existsSync(month4Dir)) {
    fs.mkdirSync(month4Dir, { recursive: true });
}

// Write the first 10 stories to markdown files
for (const item of month4Data) {
    const mdFile = path.join(month4Dir, 'day' + item.day + '.md');
    fs.writeFileSync(mdFile, item.text, 'utf8');
}

// Generate the placeholder metadata for all 30 days
const fullMonth4JSON = month4Data.map(item => {
    const { text, ...rest } = item;
    return rest;
});

// Add placeholders for 11-30 based on new_story_ideas.md
const ideas = [
    "The Magic of Banten Folklore - Indonesia",
    "The Warrior of Light: Cuchulain - Ireland",
    "Pip's Great Expectations - England",
    "The Ringbearer's Journey: The Lord of the Rings - England",
    "The Yokai and Heroes of Japanese Folktales - Japan",
    "The Scholars of Sankore University - Mali",
    "Surviving the Silk Road - Asia",
    "Lost in the Paris Catacombs - France",
    "The Wise Elder of the Andes - South America",
    "Forgotten Medicine of the Amazon - Brazil",
    "Odd Jobs in the Outback - Australia",
    "Awe at the Great Wall - China",
    "Summiting Mount Kilimanjaro - Tanzania",
    "Wonder Under the Northern Lights - Iceland",
    "Diving the Great Barrier Reef - Australia",
    "The Lost Sheet Music of Havana and Rio - Cuba",
    "The Elusive Spice - Italy",
    "The Carnival Costume Maker - Brazil",
    "The Missing Passport - Japan",
    "Navigating the Treacherous Mountain - Nepal"
];

for (let i = 0; i < 20; i++) {
    const titleText = ideas[i].split(' - ')[0];
    const countryText = ideas[i].split(' - ')[1];

    fullMonth4JSON.push({
        day: i + 11,
        country: countryText || "Unknown",
        title: titleText,
        wikiSearch: titleText,
        localImage: ""
    });
}

fs.writeFileSync(path.join(dataPath, 'month4.json'), JSON.stringify(fullMonth4JSON, null, 4), 'utf8');

// Update index.js
const indexPath = path.join(dataPath, 'index.js');
let indexContent = fs.readFileSync(indexPath, 'utf8');
if (!indexContent.includes('month4Data')) {
    indexContent = indexContent.replace("import month3Data from './month3.json';", "import month3Data from './month3.json';\\nimport month4Data from './month4.json';");
    indexContent = indexContent.replace("export const month3 = processMonthData(month3Data, 3);", "export const month3 = processMonthData(month3Data, 3);\\nexport const month4 = processMonthData(month4Data, 4);");
    indexContent = indexContent.replace("export const allMonthsDataObj = { 1: month1, 2: month2, 3: month3 };", "export const allMonthsDataObj = { 1: month1, 2: month2, 3: month3, 4: month4 };");
    fs.writeFileSync(indexPath, indexContent, 'utf8');
}

console.log("Month 4 partially generated (Days 1-10) and index.js updated!");
