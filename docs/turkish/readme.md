# 🌍 Türkçe kılavuza hoş geldiniz!

✨ **Sürüm 1.5.0-beta.1**

```
npm i djs-bot-base
```

**Not**: Bu bir beta sürümüdür. Hatalar olabilir.

# ⏰ Uzun Süreli Planlar

- Sürüm 2 için hazırlıklar yapılacak. Eğik çizgi ve mesaj komutları birleştirilecek ve birkaç yenilik daha eklenecek!

# 🚀 Yenilikler

- Bekleme süresi ve hata mesajı ayarı eklendi.
- Bakım modu ve hata mesajı ayarı eklendi.

# 🧰 Hata Düzeltmeleri

- Paketler güncellendi
- Eğik çizgi komutlarında geliştirici özel ayarı kontrolü düzeltildi.

# 🏅 Botun Örnek Ana Sayfası (index.js gibi)

ESM:

```js
import { CommandHandler, EventHandler } from "djs-bot-base";
import { Client, Partials } from "discord.js";
// Örnek koda bakın
```

CommonJS:

```js
const { CommandHandler, EventHandler } = require("djs-bot-base");
const { Client, Partials } = require("discord.js");
// Örnek koda bakın
```

Örnek kod:

```js
const commands = new CommandHandler({ prefix: "!" });
const events = new EventHandler();

const client = new Client({
  intents: ["MessageContent", "GuildMessages", "Guilds", "DirectMessages"],
  partials: [Partials.User, Partials.Channel, Partials.Message],
});
const token = "bot tokeni";

(async () => {
  await commands.setCommands();
  await commands.setSlashCommands();
  await events.setEvents(client);
  commands.setDefaultHandler(client).setDefaultSlashHandler(client);
  await client.login(token);
  await commands.registerSlashCommands(client);
})();
```

# 📦 Modülün İçeriği

- **Not**: Komut ve etkinlik sınıflarının dosya dışına aktarımı varsayılan aktarım olarak ayarlanmalıdır.

# 🛠️ Komutlar

## 🗝️ Komut Sınıfı

```js
export default new Command({
  name: "test", // Zorunlu, komutun ismi
  aliases: ["deneme"], // İsteğe bağlı, komutun yan isimleri
  guildOnly: false, // İsteğe bağlı, komutun sadece sunucuda çalışıp çalışmayacağı
  dmOnly: false, // İsteğe bağlı, komutun özelde çalışıp çalışmayacağı
  developerOnly: true, // İsteğe bağlı, komutun geliştiricilere özel olup olmayacağı
  maintenance: false, // İsteğe bağlı, komutun bakım modunda olup olmayacağı
  cooldown: 5, // İsteğe bağlı, saniye cinsinden bekleme süresi
  async run(message) {
    // Zorunlu, komut algılandığında çalıştırılacak kod
  },
});
```

- **Not**: Eğer komutunuzun sadece sunucularda/özelde çalışmasını planlıyorsanız `guildOnly/dmOnly` değişkenini aktif etmeniz kod düzenleyici uygulamanızın size daha doğru bilgi sunmasını sağlar.
  <br>⚠️ İkisini aynı anda aktif ederseniz bir etkisi olmayacaktır.

## 🗝️ Eğik Çizgi Komut Sınıfı

```js
export default new SlashCommand({
  slashCommandData: (builder) =>
    builder.setName("komut-ismi").setDescription("Komut açıklaması"), // Zorunlu, eğik çizgi komutunun verisi
  developerOnly: true, // İsteğe bağlı, komutun geliştiricilere özel olup olmayacağı
  maintenance: false, // İsteğe bağlı, komutun bakım modunda olup olmayacağı
  cooldown: 5, // İsteğe bağlı, saniye cinsinden bekleme süresi
  async run(interaction) {
    // Zorunlu, komut algılandığında çalıştırılacak kod
  },
});
```

## 💻 Komut Üstlenici Sınıfı

```js
const commands = new CommandHandler({
  commandsDir: "./commands", // İsteğe bağlı, varsayılan: "commands", taranacak komutların klasör adı
  slashCommandsDir: "./slashCommands", // İsteğe bağlı, varsayılan: "slashCommands", taranacak eğik çizgi komutlarının klasör adı
  suppressWarnings: true, // İsteğe bağlı, komut üstlenicisindeki uyarıları gizler
  prefix: "!", // İsteğe bağlı, kullanılan ön eki kendiniz ayarlayacaksanız gerek yok
  developerIds: ["geliştirici idleri"], // İsteğe bağlı, geliştiricilerin ID'leri
  messages: {
    // İsteğe bağlı, hata mesajlarını kişiselleştirir
    cooldown: "Komutu {cooldown} saniye sonra kullanabilirsin.", // İsteğe bağlı, bekleme süresi hata mesajı (bekleme süresi değişkeni "{cooldown}" ile kullanılır)
    maintenance: "Bu komut bakımda", // İsteğe bağlı, bakım modu hata mesajı
  },
});
```

- **Not**: Eğik çizgi komutların ve normal komutların klasörü aynıyken komutlar çakışacağından hata verecektir.

- Komut sistemi eğik çizgi komutları ve normal komutlar olmak üzere ikiye ayrılır:

  ### <u>Normal Komutlar</u>
  - `<CommandHandler>.setCommands()`

    Belirtilen klasörü okur ve normal komutları üstleniciye kaydeder.
    <br>💡 Komutların okunmasını beklemek için `await` kullanmanız tavsiye edilir.

  - `<CommandHandler>.getCommand(<string>)`

    Üstlenicide bulunan normal komutlarla eşleşen isme sahip normal komutu döndürür.

  - `<CommandHandler>.getCommands()`

    Üstlenicide bulunan tüm normal komutları verir.

  - `<CommandHandler>.getCommandOrAliases(<string>)`

    Üstlenicide bulunan komutların ismiyle veya yan isimleriyle eşleşen normal komutu döndürür.

  - `<CommandHandler>.clearCommands()`

    Üstlenicideki normal komutları sıfırlar.

  - `<CommandHandler>.removeCommand(<string>)`

    Belirtilen isimle eşleşen normal komutu üstleniciden siler.

  - `<CommandHandler>.setDefaultHandler(<Client>)`

    Modüldeki varsayılan normal komut çalıştırıcısını etkinlik olarak kaydeder.
    <br>⚠️ Sunucuya özel değiştirilebilir ön ek gibi özellikleri desteklemez.

  - `<CommandHandler>.runDefaultHandler(<Message>, <string?>)`

    Modüldeki varsayılan normal komut çalıştırıcısını çalıştırmayı sağlar.
    <br>💡 `setDefaultHandler(<Client>)` kullanmak yerine bunu etkinlik içine ekleyerek kullanmanız önerilir.

  - `<CommandHandler>.removeDefaultHandler(<Client>)`

    Kaydedilen varsayılan normal komut çalıştırıcısını bottan kaldırır.

  ### <u>Eğik Çizgi Komutları</u>
  - `<CommandHandler>.setSlashCommands()`

    Belirtilen klasörü okur ve eğik çizgi komutlarını üstleniciye kaydeder.
    <br>💡 Komutların okunmasını beklemek için `await` kullanmanız tavsiye edilir.

  - `<CommandHandler>.getSlashCommand(<string>)`

    Üstlenicide bulunan eğik çizgi komutlarıyla eşleşen isme sahip eğik çizgi komutunu döndürür.

  - `<CommandHandler>.getSlashCommands()`

    Üstlenicide bulunan tüm eğik çizgi komutlarını verir.

  - `<CommandHandler>.clearSlashCommands()`

    Üstlenicideki eğik çizgi komutlarını sıfırlar.

  - `<CommandHandler>.removeSlashCommand(<string>)`

    Belirtilen isimle eşleşen eğik çizgi komutunu üstleniciden siler.

  - `<CommandHandler>.setDefaultSlashHandler(<Client>)`

    Modüldeki varsayılan eğik çizgi komutu çalıştırıcısını etkinlik olarak kaydeder.

  - `<CommandHandler>.runDefaultHandler(<Message>, <string?>)`

    Modüldeki varsayılan eğik çizgi komutu çalıştırıcısını çalıştırmayı sağlar.
    <br>💡 `setDefaultSlashHandler(<Client>)` kullanmak yerine bunu etkinlik içine ekleyerek kullanmanız önerilir.

  - `<CommandHandler>.removeDefaultHandler(<Client>)`

    Kaydedilen varsayılan eğik çizgi komutu çalıştırıcısını bottan kaldırır.

  - `<CommandHandler>.registerSlashCommands(<Client>, <string?>)`

    Üstlenicideki kaydedilen komutları bota kaydeder ve komutlar kullanılabilir olur. Sunucuya özel komutlar kaydedilebilir.

# 📻 Etkinlikler

## 🗝️ Etkinlik Sınıfı

```js
export default new Event({
  categoryName: "ready", // Zorunlu, etkinliğin bulunacağı kategori
  runOrder: 1, // İsteğe bağlı, etkinliğin çalışma sırası, en küçük sayı en önce çalışır (en küçük 0), değer girilmezse değer belirtilenlerden sonra çalışır
  async run(client) {
    // Zorunlu, etkinlik algılandığında çalıştırılacak kod
  },
});
```

- **Not**: Eğer birkaç etkinliğin çalıştırılma sırası aynıysa veya belirtilmemişse okunma sırasına göre sıralanırlar.
- **Not**: Çalıştırılma sırası belirtilmiş etkinlikler öncelikli olarak çalıştırılırlar.

## 💻 Etkinlik Üstlenici Sınıfı

```js
const events = new EventHandler({
  eventsDir: "./events", // İsteğe bağlı, varsayılan: "events", taranacak etkinliklerin klasör adı
  suppressWarnings: false, // İsteğe bağlı, etkinlik üstlenicisindeki uyarıları gizler
});
```

- `<EventHandler>.setEvents(<Client>)`

  Belirtilen klasörü okur ve etkinlikleri üstleniciye kaydederken bota da kaydeder.
  <br>💡 Etkinliklerin okunmasını beklemek için `await` kullanmanız tavsiye edilir.

- `<EventHandler>.getEventCategory(<string>)`

  Üstlenicide bulunan etkinlik kategorisindeki etkinlikleri ve ek veriyi döndürür.

- `<EventHandler>.getEvents()`

  Üstlenicide bulunan tüm eventleri verir.

- `<EventHandler>.clearEvents()`

  Üstlenicideki ve bottaki etkinlikleri temizler.

# 🪰 Hata mı Buldun?

- 🐜 Eğer bir hata bulduysanız ve çözümünü biliyorsanız yeni istek ([pull request](https://github.com/Wyntine/DjsBotBase/compare)) açabilirsiniz!
- 📱 Bana ulaşmak istiyorsanız [discord](https://discord.com/users/920360120469311578) üzerinden ulaşabilirsiniz!

---

<p align="center">Cartel & Wyntine tarafından Geliştirilmiştir</p>
