const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const axios = require("axios");
const sharp = require("sharp");
const Tesseract = require("tesseract.js");
require("dotenv").config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = process.env.GEMINI_API_URL;
const GRUP_TARGETS = process.env.GRUP_TARGETS.split(",");

// Inisialisasi client WhatsApp
const client = new Client({
  authStrategy: new LocalAuth(), // Untuk menyimpan sesi agar tidak perlu scan QR setiap kali
});

// Generate QR code di terminal
client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

// Log saat bot terhubung
client.on("ready", async () => {
  console.log("Bot is ready!");

  // //   Mengambil daftar semua chat yang ada
  // const chats = await client.getChats();

  // // Filter chat yang merupakan grup
  // const groupChats = chats.filter((chat) => chat.isGroup);

  // console.log("Daftar ID Grup:");
  // groupChats.forEach((group) => {
  //   console.log(`Nama Grup: ${group.name}, ID Grup: ${group.id._serialized}`);
  // });
});

// Daftar kata kunci untuk pertanyaan sensitif
const sensitiveKeywords = [
  "ehem",
  "seks",
  "cinta",
  "kelon",
  "restoran",
  "kawin",
  "makan",
  "minum",
  "mandi",
  "tidur",
];

// Daftar jawaban acak untuk topik sensitif seperti "ehem" (seks)
const ehemResponses = [
  "Mau gaya kodok atau yang lain om ? 😉",
  "Hmm, rasanya ini obrolan yang seru, tapi bagaimana kalau kita bicarakan hal lain dulu? 😅",
  "Gass, mau diamana? 😍",
  "Ayo om, mau gaya kodok atau heikopter? 😄 ",
  "Topik seperti ini memang menarik, tapi yuk kita lanjut ke hal-hal yang lebih seru! 😄",
  "Oh, sepertinya kamu penasaran! Apa ada hal lain yang ingin kamu bicarakan juga? 😇",
  "Dasar peedo pikiranyan ehemmm mulu 😡",
  "Wah, pertanyaan ini cukup dalam! Kita harus ngobrol lebih lanjut suatu hari nanti. 😊",
  "Ah, topik yang sangat pribadi! Mungkin kita bisa bahas hal-hal lain yang menarik? 😄",
  "Hmm, pembicaraan ini bisa jadi panjang! Apa kamu siap mendiskusikannya? 😏",
  "Ehem... pembicaraan seperti ini selalu menarik, ya? 😏",
  "Ehem mulu, birahi kah om 🤗?",
];

// Fungsi untuk memilih respons acak dari daftar jawaban
const getRandomEhemResponse = () => {
  return ehemResponses[Math.floor(Math.random() * ehemResponses.length)];
};

// Daftar jawaban romantis dan ajakan
const romanticGreetings = [
  "💖 Hei sayang, ada yang bisa aku bantu? 😊",
  "🌹 Kamu terlihat begitu mempesona hari ini! Ada yang ingin kita obrolin? 😘",
  "💘 Halo cintaku, apa yang bisa kubantu untukmu? 😍",
  "✨ Hai manis, apa kabar? Ada yang ingin kita bicarakan? 💕",
  "😍 Aku di sini untukmu, sayang. Apa yang bisa kubantu hari ini? 🌸",
  "🌷 Hai cinta, kalau ada apa-apa langsung saja bilang ya, aku siap mendengarkan! 💖",
  "💐 Halo sayang, aku rindu obrolan kita. Ada yang bisa kubantu? 😘",
  "💖 Hei cantik, aku selalu di sini untukmu! Ada yang ingin kamu tanyakan? 😍",
  "✨ Hai sayangku, aku siap mendengar dan membantu apapun yang kamu butuhkan. 🌹",
  "💘 Apa kabar, sayang? Aku selalu ada buat kamu. Ingin ngobrol atau ada yang perlu bantuan? 😘",
];

// Fungsi untuk memilih kata-kata romantis dan ajakan secara acak
const getRandomRomanticGreeting = () => {
  return romanticGreetings[
    Math.floor(Math.random() * romanticGreetings.length)
  ];
};

//Daftar jawaban romatis makan
const romanticFood = [
  "Makan bareng kamu pasti rasanya lebih enak, sayang. 🍽️",
  "Aku siap makan apa pun asalkan bersamamu. 😘",
  "Makan yuk, biar kita tambah kuat cinta-cintaan. 💕",
  "Kamu selalu bikin aku lapar, lapar cinta. 😍",
  "Makan sama kamu bikin hati ini kenyang juga. ❤️",
  "Apa pun makanannya, yang penting ada kamu. 😘",
  "Kita makan bareng, biar tambah lengket kaya lem. 😄",
  "Makan yuk, aku siap jadi teman makan setiamu. 🍽️",
  "Makan apa aja, asal kamu yang suapin. 😉",
  "Mau makan apa? Aku cuma mau kamu aja. 😋",
  "Makan bareng kamu selalu bikin selera makan tambah besar. 🍽️",
  "Kalau makan sama kamu, semua makanan jadi terasa lebih enak. 😋",
  "Yuk, kita makan bareng. Makanan jadi lebih lezat kalau dimakan sama yang tersayang. ❤️",
  "Kamu mau makan apa hari ini? Aku siap nemenin! 🍕",
  "Makan sama kamu tuh seperti merasakan surga di lidah. 😘",
  "Nggak penting makan apa, yang penting sama kamu. 🍲",
  "Lagi laper ya? Yuk kita makan, biar kenyang dan bahagia bareng. 😊",
  "Apa yang paling kamu pengen makan sekarang? Aku siap masakin buat kamu. 👨‍🍳",
  "Kalau makan sambil tatap mata kamu, rasanya lebih kenyang. 😍",
  "Makan yuk, biar nggak cuma hati aja yang kenyang. ❤️",
  "Makan malam bareng kamu? Aku pasti nggak bakal nolak! 🍽️",
  "Kamu suka makan apa? Aku suka apa yang kamu suka. 😘",
  "Yuk kita coba makanan baru bareng, pasti seru! 🍜",
  "Makan siang sama kamu selalu jadi highlight hariku. 🥰",
  "Aku bawa makanan favoritmu nih, siap-siap ya! 🍱",
  "Makan adalah kebahagiaan, apalagi kalau bareng kamu. 🍝",
  "Nggak ada yang lebih indah dari makan malam romantis berdua. 💕",
  "Kalau sama kamu, nasi goreng pun jadi makanan mewah. 🍛",
  "Makan bareng kamu bikin aku lupa diet. 😅",
  "Aku lapar, tapi lebih lapar sama perhatianmu. 😏",
];

//fungsi untuk memilih  kata-kata romantis makan secara acak
const getRandomRRomanticFood = () => {
  return romanticFood[Math.floor(Math.random() * romanticFood.length)];
};
//Daftar jawaban romatis makan
const romanticDrink = [
  "Minum dulu yuk, biar rasa rindu kita nggak kering. 💧",
  "Segarnya air nggak ada apa-apanya dibanding cinta kamu. 😘",
  "Minum bareng kamu aja udah bikin hati ini adem. 🌹",
  "Minum dulu, biar cintamu makin deras seperti air. 💦",
  "Mau minum apa? Yang pasti aku haus cintamu. 😍",
  "Minuman paling enak tuh teh cinta dari kamu. 🍵",
  "Ayo kita minum, biar rindu ini larut bersamamu. 😘",
  "Satu teguk cinta kamu bikin hati adem banget. 💕",
  "Minum yuk, cinta kita harus selalu terhidrasi. 😘",
  "Haus ya? Aku juga haus perhatian kamu. 😍",
  "Udah minum hari ini? Biar tetap sehat buat aku. 💧",
  "Minum air putih dulu, sayang, biar tetap segar dan fit. 🥤",
  "Kalau minum teh sama kamu, teh ini jadi terasa lebih manis. 🍵",
  "Aku siap bikinin kamu kopi atau teh, apa yang kamu mau? ☕",
  "Minum dulu yuk, biar semangatnya nggak hilang. 💪",
  "Minum bareng kamu rasanya lebih menyegarkan. 💧",
  "Jangan lupa minum air putih biar nggak dehidrasi, ya sayang. 😘",
  "Aku selalu inget kamu, apalagi pas lagi minum jus favoritmu. 🍹",
  "Minum air dulu yuk, sambil ngobrolin hal-hal manis sama kamu. 😍",
  "Minum yang manis-manis sambil tatap mata kamu, ah... sempurna. 🥤",
  "Minum yuk, biar badannya tetap bugar buat jalan bareng aku. 💕",
  "Udah minum vitamin juga? Biar kamu selalu sehat buat kita. 🌸",
  "Apa minuman favoritmu? Aku akan bikinin kapan pun kamu mau. 🍶",
  "Nggak ada yang lebih menyegarkan selain minum sambil lihat senyuman kamu. 😍",
  "Minum es teh sama kamu selalu bikin hati adem. 🍹",
  "Minuman dingin pas sama hatiku yang hangat pas deket kamu. ☕",
  "Kalau minuman ini nggak cukup buat hilangin haus, aku ada buat ngisi hatimu. 😘",
  "Biar nggak pusing, minum dulu yuk yang segar-segar. 💧",
  "Minum cokelat panas sambil ngobrol bareng kamu tuh enak banget. 🍫",
  "Mau minum apa, sayang? Aku siap buat pesen yang kamu suka. 🍷",
];

//fungsi untuk memilih  kata-kata romantis makan secara acak
const getRandomRRomanticDrink = () => {
  return romanticDrink[Math.floor(Math.random() * romanticDrink.length)];
};
//Daftar jawaban romatis makan
const romanticSleep = [
  "Tidur yuk, biar mimpi kita ketemu. 😘",
  "Bobo yuk, biar kita ketemu di alam mimpi. 💫",
  "Aku siap tidur kalau ada pelukan virtual dari kamu. 🤗",
  "Selamat tidur, semoga mimpi indah kita selamanya. 🌙",
  "Tidur yuk, biar rinduku ketemu sama kamu di mimpi. 😴",
  "Semoga malam ini mimpi kita penuh cinta. 🌟",
  "Selamat malam, aku mimpiin kamu tiap malam. 😘",
  "Malam ini, tidurku pasti nyenyak karena ada kamu di pikiran. 💕",
  "Tidur yuk, cinta kita tetap terjaga meski tertidur. ❤️",
  "Bobo dulu ya, nanti aku jemput di mimpi. 🌙",
  "Tidur yuk, biar mimpi indah kita lanjut sampai besok. 😴",
  "Selamat tidur sayang, mimpi indah ya. Aku akan jaga mimpimu. 🌙",
  "Tidur sama kamu di pikiran bikin aku tenang. 😘",
  "Udah waktunya istirahat, sayang. Biar kamu bangun dengan senyum. 💤",
  "Aku bakal selalu jadi selimutmu, yang ngasih rasa hangat. 😍",
  "Tidur yuk, biar besok kita bisa petualangan bareng lagi. 🌙",
  "Kamu harus tidur yang nyenyak, biar mimpi ketemu aku. 😘",
  "Jangan lupa bobo cantik ya, aku udah nunggu kamu di mimpi. 💤",
  "Kamu istirahat dulu ya, biar besok semangat bareng aku. 🌸",
  "Semoga tidurmu nyenyak malam ini, dan kita ketemu di mimpi. 🥰",
  "Tidur yuk, biar aku bisa nemenin kamu di mimpi indahmu. 🌠",
  "Kalau aku jadi bantal, kamu pasti tidur nyenyak tiap malam. 😌",
  "Selamat malam, cinta. Aku bakal jagain mimpimu sampai pagi. 💫",
  "Tidur yang nyenyak ya, besok aku bakal kangen kamu lagi. ❤️",
  "Sebelum tidur, jangan lupa inget aku ya. 😘",
  "Tidur cepat biar kita bisa ngobrol lebih banyak besok pagi. 😴",
  "Semoga tidurmu nyenyak kayak nyamannya hatiku pas deket kamu. 🛌",
  "Biar kita pisah sekarang, tapi aku bakal temenin kamu di mimpi. 🌟",
  "Udah malam, sayang. Tidur yuk, mimpi kita pasti indah. 💤",
  "Aku bakal mimpiin kamu tiap malam, kamu mimpikan aku juga ya. 🌙",
];

//fungsi untuk memilih  kata-kata romantis makan secara acak
const getRandomRRomanticSleep = () => {
  return romanticSleep[Math.floor(Math.random() * romanticSleep.length)];
};

//Daftar jawaban romatis makan
const romanticBathe = [
  "Mandi biar segar, segar seperti cinta kita. 💧",
  "Udah mandi? Kamu pasti tambah cantik dan segar. 😘",
  "Mandi biar rindu ini nggak terlalu panas. 😄",
  "Segarnya mandi cuma kalah sama segarnya cinta kamu. 💕",
  "Mandi dulu, nanti kita ketemu lagi ya, sayang. 😘",
  "Kamu udah mandi belum? Karena cinta ini udah bersih dan jernih. 💧",
  "Mandi biar segar, seperti perasaan ini buat kamu. 😍",
  "Kalau kamu udah mandi, aku bakal cinta kamu lebih bersih lagi. 🛁",
  "Setelah mandi, cinta kita pasti tambah wangi. 🌸",
  "Mandi dulu ya, biar cinta kita segar lagi. 💖",
];

//fungsi untuk memilih  kata-kata romantis makan secara acak
const getRandomRRomanticBathe = () => {
  return romanticBathe[Math.floor(Math.random() * romanticBathe.length)];
};

//Daftar jawaban romatis makan
const romanticLove = [
  "Aku cinta kamu, lebih dari yang bisa diungkapkan kata-kata. ❤️",
  "Cinta ini buat kamu, nggak akan luntur selamanya. 💕",
  "Cinta kita tak bisa diukur, hanya bisa dirasakan. 😘",
  "Kamu adalah cinta yang selalu aku tunggu. 😍",
  "Cinta kamu bikin hidup ini terasa sempurna. 💖",
  "Aku cinta kamu seperti angin yang selalu ada, meski nggak terlihat. 🌬️",
  "Cinta ini seperti api, semakin lama semakin membara. 🔥",
  "Cinta kita akan bertahan selamanya, aku yakin itu. ❤️",
  "Aku cinta kamu, sekarang, besok, dan selamanya. 💕",
  "Kamu adalah cinta yang nggak bisa aku lepaskan. 😘",
];

//fungsi untuk memilih  kata-kata romantis makan secara acak
const getRandomRRomanticLove = () => {
  return romanticLove[Math.floor(Math.random() * romanticLove.length)];
};

// Mendengarkan pesan yang masuk
client.on("message", async (message) => {
  const sender = message.from;
  const query = message.body.toLowerCase();

  // Cek apakah pesan datang dari grup target atau dari chat pribadi
  const isGroupTarget = GRUP_TARGETS.includes(sender);
  const isPrivateChat = !message.from.includes("@g.us");

  // Jika pesan hanya berisi "/ai", "/cika", atau "/sayang", bot memberikan respons romantis
  if (
    (isGroupTarget || isPrivateChat) &&
    (query === "/beb" || query === "/cika" || query === "/sayang")
  ) {
    const romanticGreeting = getRandomRomanticGreeting();
    client.sendMessage(sender, romanticGreeting);
  }

  // Jika pesan mengandung salah satu kata tersebut, tetapi diikuti oleh teks lain
  else if (
    (isGroupTarget || isPrivateChat) &&
    (query.includes("/beb") ||
      query.includes("/cika") ||
      query.includes("/sayang"))
  ) {
    // Bersihkan input dari kata pemicu (/ai, /cika, /sayang)
    const cleanedQuery = query
      .replace(/\/beb/g, "")
      .replace(/\/cika/g, "")
      .replace(/\/sayang/g, "")
      .trim();

    // Cek apakah pertanyaan termasuk dalam kategori sensitif
    if (containsSensitiveKeyword(cleanedQuery)) {
      const humanResponse = getHumanResponse(cleanedQuery);
      client.sendMessage(sender, humanResponse);
    } else if (cleanedQuery) {
      const aiResponse = await getAIResponse(cleanedQuery);
      const romanticResponse = getRandomRomanticResponse(aiResponse);
      client.sendMessage(sender, romanticResponse);
    }
  }

  // Handle jika pesan adalah gambar atau video untuk stiker
  if (message.body.startsWith("/stiker")) {
    if (message.hasMedia) {
      const media = await message.downloadMedia();
      if (
        media.mimetype.startsWith("image") ||
        media.mimetype.startsWith("video")
      ) {
        const sticker = new MessageMedia(media.mimetype, media.data);
        await client.sendMessage(sender, sticker, { sendMediaAsSticker: true });
      } else {
        client.sendMessage(
          sender,
          "Kirimkan gambar atau video untuk dijadikan stiker."
        );
      }
    } else {
      client.sendMessage(
        sender,
        "Kirimkan gambar atau video dengan perintah /stiker."
      );
    }
  }

  // Handle pertanyaan tentang gambar menggunakan perintah /gambar
  if (query.startsWith("/gambar")) {
    if (message.hasMedia) {
      const media = await message.downloadMedia();
      if (media.mimetype.startsWith("image")) {
        // Menggunakan Tesseract untuk mengekstrak teks dari gambar
        const buffer = Buffer.from(media.data, "base64");

        Tesseract.recognize(
          buffer,
          "eng", // Bahasa yang digunakan
          {
            logger: (info) => console.log(info), // Untuk logging proses OCR
          }
        )
          .then(({ data: { text } }) => {
            // Menggunakan teks yang diekstrak untuk mendapatkan respons AI
            const cleanedText = text.trim();
            if (cleanedText) {
              getAIResponse(cleanedText).then((aiResponse) => {
                client.sendMessage(sender, aiResponse);
              });
            } else {
              client.sendMessage(
                sender,
                "Maaf, saya tidak bisa menemukan teks dalam gambar tersebut."
              );
            }
          })
          .catch((err) => {
            console.error("Error during OCR:", err);
            client.sendMessage(
              sender,
              "Maaf, ada kesalahan saat membaca gambar tersebut."
            );
          });
      } else {
        client.sendMessage(sender, "Kirimkan gambar dengan perintah /gambar.");
      }
    } else {
      client.sendMessage(sender, "Kirimkan gambar dengan perintah /gambar.");
    }
  }
});

// Fungsi untuk memeriksa apakah pertanyaan mengandung kata kunci sensitif
const containsSensitiveKeyword = (query) => {
  return sensitiveKeywords.some((keyword) =>
    query.toLowerCase().includes(keyword)
  );
};

// Fungsi untuk memberikan respons yang lebih manusiawi
const getHumanResponse = (query) => {
  // Ganti "ehem" dengan "seks" untuk respons
  if (query.includes("ehem")) {
    return getRandomEhemResponse();
  } else if (query.includes("seks")) {
    return getRandomEhemResponse();
  } else if (query.includes("kawin")) {
    return getRandomEhemResponse();
  } else if (query.includes("kelon")) {
    return getRandomEhemResponse();
  } else if (query.includes("makan")) {
    return getRandomRRomanticFood();
  } else if (query.includes("minum")) {
    return getRandomRRomanticDrink();
  } else if (query.includes("tidur")) {
    return getRandomRRomanticSleep();
  } else if (query.includes("mandi")) {
    return getRandomRRomanticBathe();
  } else {
    return "Hmm, aku tidak bisa memberikan jawaban pasti tentang itu, tapi aku ingin tahu pandanganmu!";
  }
};

// Fungsi untuk mendapatkan jawaban dari AI
const getAIResponse = async (query) => {
  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: query,
              },
            ],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // Memeriksa apakah respons memiliki struktur yang diharapkan
    if (
      response.data &&
      response.data.candidates &&
      response.data.candidates.length > 0 &&
      response.data.candidates[0].content
    )
      if (response.data.candidates && response.data.candidates.length > 0) {
        // Periksa struktur respons
        const aiText = response.data.candidates[0].content; // Ambil teks dari kandidat pertama
        if (aiText && aiText.parts && aiText.parts[0].text) {
          return aiText.parts[0].text.trim(); // Mengembalikan teks yang telah dibersihkan
        } else {
          console.warn("Unexpected response structure:", response.data);
          return "Maaf, aku tidak bisa memberikan jawaban saat ini. 😔";
        }
      } else {
        console.warn("Unexpected response structure:", response.data);
        return "Maaf, aku tidak bisa memberikan jawaban saat ini. 😔";
      }
  } catch (error) {
    console.error(
      "Error with Gemini API:",
      error.response ? error.response.data : error.message
    );
    return "Maaf, aku sedang tidak bisa berpikir. 😢";
  }
};

// Fungsi untuk mendapatkan jawaban dari AI berdasarkan gambar
const getAIResponseFromImage = async (media) => {
  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        image: {
          data: media.data, // Contoh untuk mengirimkan gambar ke AI, sesuaikan dengan API Gemini
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.answer; // Sesuaikan dengan struktur respons API
  } catch (error) {
    console.error(
      "Error with Gemini API:",
      error.response ? error.response.data : error.message
    );
    return "Maaf, aku tidak bisa mengenali gambar ini. 😔";
  }
};

// Array kata-kata romantis yang akan dipilih secara acak
const romanticPhrases = [
  "❤️ Kamu selalu di pikiranku, sayang. 😘",
  "💖 Setiap kata dari mulutmu adalah puisi, manis. 🌹",
  "🌷 Hatiku bergetar setiap kali kamu dekat, sayang. 💕",
  "😍 Kamu adalah bintang terindah di langitku. ✨",
  "🌹 Dunia terasa lebih indah bersamamu. 💖",
  "💘 Cintaku padamu tak terbatas. 😘",
  "💫 Kamu adalah inspirasiku setiap hari, sayang. 🌹",
  "💖 Denganmu, hidupku jadi penuh warna. 🎨",
  "💐 Kamu adalah alasan aku tersenyum setiap hari. 😍",
  "❤️ Hidup ini indah karena kamu ada. 😘",
  "🌸 Kamu selalu membuat hariku lebih cerah. ☀️",
  "😍 Tak ada yang lebih manis daripada senyumanmu. 💘",
  "🌷 Kamu adalah alasan jantungku berdetak lebih kencang. ❤️",
  "🌹 Kamu adalah keajaiban yang selalu aku syukuri. 💫",
  "💖 Hatiku milikmu selamanya, sayang. 💘",
  "✨ Cintamu adalah cahaya yang menuntunku. 💕",
  "💫 Kamu adalah mimpiku yang menjadi nyata. 😘",
  "💖 Denganmu, setiap momen terasa sempurna. 🌷",
  "🌹 Aku akan mencintaimu sampai akhir waktu. ❤️",
  "💘 Tak ada yang lebih indah dari kita, sayang. 😍",
];

// Fungsi untuk memilih kata-kata romantis secara acak
const getRandomRomanticResponse = (aiResponse) => {
  const randomPhrase =
    romanticPhrases[Math.floor(Math.random() * romanticPhrases.length)];
  return `${randomPhrase} ${aiResponse}`;
};

// Memulai bot
client.initialize();
