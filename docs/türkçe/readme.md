# Türkçe kılavuza hoş geldiniz!

- **Not**: Aşağıda gördüğünüz örnek **ESM** modül sistemi ile verilen örnektir. Eğer ESM kullanmıyorsanız paketleri `require(...)` ile aktarabilirsiniz.

## Botun örnek ana sayfası (index.js gibi):

```js
import { CommandHandler, EventHandler } from "djs-bot-base";
import { Client, Partials } from "discord.js";

const commands = new CommandHandler({
  suppressWarnings: true,
  prefix: "!",
  developerIds: ["geliştirici idleri"],
});
const events = new EventHandler();

const client = new Client({
  intents: ["MessageContent", "GuildMessages", "Guilds", "DirectMessages"],
  partials: [Partials.User, Partials.Channel, Partials.Message],
});

await commands.setCommands();
commands.setDefaultHandler(client);
await events.setEvents(client);
client.login("token");
```

## Modülün içeriği

- Modülde komut ve etkinliklerin sınıfı (class) ve üstlenicileri (handler) bulunmaktadır:
  <br>⚠️ Komut ve etkinlik sınıflarının dosya dışına aktarımı varsayılan aktarım olarak ayarlanmalıdır.

  ### 🗝️ Komut sınıfı

  ```js
  export default new Command({
    name: "test", // Zorunlu, komutun ismi
    aliases: ["deneme"] // İsteğe bağlı, komutun yan isimleri
    guildOnly: false, // İsteğe bağlı, komutun sadece sunucuda çalışıp çalışmayacağı
    dmOnly: false, // İsteğe bağlı, komutun özelde çalışıp çalışmayacağı
    developerOnly: true, // İsteğe bağlı, komutun geliştiricilere özel olup olmayacağı
    async run(message) {
      // Zorunlu, komut algılandığında çalıştırılacak kod
    },
  });
  ```

  - **Not**: Eğer komutunuzun sadece sunucularda/özelde çalışmasını planlıyorsanız `guildOnly/dmOnly` değişkenini aktif etmeniz kod düzenleyici uygulamanızın size daha doğru bilgi sunmasını sağlar.
    <br>⚠️ İkisini aynı anda aktif ederseniz bir etkisi olmayacaktır.<br><br>

  ### 💻 Komut üstlenici sınıfı

  ```js
  const commands = new CommandHandler({
    commandsDir: "commands", // İsteğe bağlı, varsayılan: "commands", taranacak komutların klasör adı
    suppressWarnings: true, // İsteğe bağlı, komut üstlenicisindeki uyarıları gizler
    prefix: "!", // İsteğe bağlı, kullanılan ön eki kendiniz ayarlayacaksanız gerek yok
    developerIds: ["geliştirici idleri"], // İsteğe bağlı, geliştiricilerin idleri
  });
  ```

  - `<CommandHandler>.setCommands()`

    Belirtilen klasörü okur ve komutları üstleniciye kaydeder.
    <br>💡 Komutların okunmasını beklemek için `await` kullanmanız tavsiye edilir.

  - `<CommandHandler>.getCommand(<string>)`

    Üstlenicide bulunan komutlarla eşleşen isme sahip komutu döndürür.

  - `<CommandHandler>.getCommandOrAliases(<string>)`

    Üstlenicide bulunan komutların ismiyle veya yan isimleriyle eşleşen komutu döndürür.

  - `<CommandHandler>.clearCommands()`

    Üstlenicideki komutları sıfırlar.

  - `<CommandHandler>.removeCommand(<string>)`

    Belirtilen isimle eşleşen komutu üstleniciden siler.

  - `<CommandHandler>.setDefaultHandler(<Client>)`

    Modüldeki varsayılan komut çalıştırıcısını etkinlik olarak kaydeder.
    <br>⚠️ Sunucuya özel değiştirilebilir ön ek gibi özellikleri desteklemez.

  - `<CommandHandler>.runDefaultHandler(<Message>, <string?>)`

    Modüldeki varsayılan komut çalıştırıcısını çalıştırmayı sağlar.
    <br>💡 `setDefaultHandler(<Client>)` kullanmak yerine bunu etkinlik içine ekleyerek kullanmanız önerilir.<br><br>

  ### 🗝️ Etkinlik sınıfı

  ```js
  export default new Event({
    categoryName: "ready", // Zorunlu, etkinliğin bulunacağı kategori
    runOrder: 1, // İsteğe bağlı, etkinliğin çalışma sırası, en küçük sayı en önce çalışır (en küçük 0), değer girilmezse değer belirtilenlerden sonra çalışır
    async run(client) {
      // Zorunlu, etkinlik algılandığında çalıştırılacak kod
    },
  });
  ```

  - **Not**: Eğer birkaç etkinliğin çalıştırılma sırası aynıysa veya belirtilmemişse okunma sırasına göre sıralanırlar.<br><br>

  ### 💻 Etkinlik üstlenici sınıfı

  ```js
  const events = new EventHandler({
    eventsDir: "events", // İsteğe bağlı, varsayılan: "events", taranacak etkinliklerin klasör adı
    suppressWarnings: false, // İsteğe bağlı, etkinlik üstlenicisindeki uyarıları gizler
  });
  ```

  - `<EventHandler>.setEvents(<Client>)`

    Belirtilen klasörü okur ve etkinlikleri üstleniciye kaydederken bota da kaydeder.
    <br>💡 Etkinliklerin okunmasını beklemek için `await` kullanmanız tavsiye edilir.

  - `<EventHandler>.getEventCategory(<string>)`

    Üstlenicide bulunan etkinlik kategorisindeki etkinlikleri ve ek veriyi döndürür.

  - `<EventHandler>.clearEvents()`

    Üstlenicideki ve bottaki etkinlikleri temizler.

# Bir hata buldum!

- 🐜 Eğer bir hata bulduysanız ve çözümünü biliyorsanız yeni istek ([pull request](https://github.com/Wyntine/DjsBotBase/compare)) açabilirsiniz!
- 📱 Bana ulaşmak istiyorsanız [discord](https://discord.com/users/920360120469311578) üzerinden ulaşabilirsiniz!
