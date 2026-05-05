import { PrismaClient, Role, AdType, AdStatus, NotificationType, ComplaintTargetType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Начинаем заполнение базы данных...');

  // ─── ОЧИСТКА ────────────────────────────────────────────────────────────────
  await prisma.supportMessage.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.chat.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.adPhoto.deleteMany();
  await prisma.location.deleteMany();
  await prisma.ad.deleteMany();
  await prisma.notificationSettings.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.emailVerificationToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.telegramLinkToken.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ База очищена');

  // ─── ПАРОЛЬ ─────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 10);
  const now = new Date();

  // ─── ПОЛЬЗОВАТЕЛИ ───────────────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      email: 'admin@findme.by',
      passwordHash,
      name: 'Администратор',
      phone: '+375291000000',
      role: Role.ADMIN,
      emailVerifiedAt: now,
      createdAt: new Date('2026-01-01'),
    },
  });

  const users = await Promise.all([
    prisma.user.create({ data: { email: 'ivan@findme.by', passwordHash, name: 'Иван Петров', phone: '+375291111111', emailVerifiedAt: now, createdAt: new Date('2026-01-15') } }),
    prisma.user.create({ data: { email: 'maria@findme.by', passwordHash, name: 'Мария Сидорова', phone: '+375292222222', emailVerifiedAt: now, createdAt: new Date('2026-01-20') } }),
    prisma.user.create({ data: { email: 'alex@findme.by', passwordHash, name: 'Александр Козлов', phone: '+375293333333', emailVerifiedAt: now, createdAt: new Date('2026-02-01') } }),
    prisma.user.create({ data: { email: 'olga@findme.by', passwordHash, name: 'Ольга Новикова', phone: '+375294444444', emailVerifiedAt: now, createdAt: new Date('2026-02-10') } }),
    prisma.user.create({ data: { email: 'dmitry@findme.by', passwordHash, name: 'Дмитрий Волков', phone: '+375295555555', emailVerifiedAt: now, createdAt: new Date('2026-02-15') } }),
    prisma.user.create({ data: { email: 'anna@findme.by', passwordHash, name: 'Анна Морозова', phone: '+375296666666', emailVerifiedAt: now, createdAt: new Date('2026-03-01') } }),
    prisma.user.create({ data: { email: 'sergey@findme.by', passwordHash, name: 'Сергей Лебедев', phone: '+375297777777', emailVerifiedAt: now, createdAt: new Date('2026-03-10') } }),
    prisma.user.create({ data: { email: 'natasha@findme.by', passwordHash, name: 'Наталья Соколова', phone: '+375298888888', emailVerifiedAt: now, createdAt: new Date('2026-03-20') } }),
    prisma.user.create({ data: { email: 'pavel@findme.by', passwordHash, name: 'Павел Зайцев', phone: '+375299999999', emailVerifiedAt: now, createdAt: new Date('2026-04-01') } }),
    prisma.user.create({ data: { email: 'elena@findme.by', passwordHash, name: 'Елена Попова', phone: '+375291010101', emailVerifiedAt: now, createdAt: new Date('2026-04-10') } }),
  ]);

  console.log(`✅ Создано ${users.length + 1} пользователей`);

  // ─── ОБЪЯВЛЕНИЯ ─────────────────────────────────────────────────────────────
  const adsData = [
    // APPROVED - LOST
    { userId: users[0].id, type: AdType.LOST, status: AdStatus.APPROVED, petName: 'Макс', animalType: 'Собака', breed: 'Лабрадор', color: 'Рыжий', description: 'Потерялся в районе парка Горького 15 мая около 18:00. Рыжий окрас, ошейник синего цвета с адресником. Очень дружелюбный, подходит к людям. Вознаграждение гарантировано.', views: 142, city: 'Минск', address: 'Парк Горького', lat: 53.9045, lng: 27.5615, createdAt: new Date('2026-05-15') },
    { userId: users[1].id, type: AdType.LOST, status: AdStatus.APPROVED, petName: 'Муся', animalType: 'Кошка', breed: 'Персидская', color: 'Серый', description: 'Серая полосатая кошка, пропала около дома на ул. Ленина. Очень пугливая, не подходит к чужим. Стерилизована, есть чип.', views: 89, city: 'Минск', address: 'ул. Ленина, 10', lat: 53.9006, lng: 27.5590, createdAt: new Date('2026-05-10') },
    { userId: users[2].id, type: AdType.LOST, status: AdStatus.APPROVED, petName: 'Буран', animalType: 'Собака', breed: 'Хаски', color: 'Серо-белый', description: 'Голубоглазый хаски, убежал во время прогулки в Лошицком парке. Откликается на имя Буран. На ошейнике есть номер телефона.', views: 203, city: 'Минск', address: 'Лошицкий парк', lat: 53.8456, lng: 27.6012, createdAt: new Date('2026-05-08') },
    { userId: users[3].id, type: AdType.LOST, status: AdStatus.APPROVED, petName: 'Рыжик', animalType: 'Собака', breed: 'Шпиц', color: 'Рыжий', description: 'Маленький рыжий шпиц, очень активный. Пропал во дворе дома на ул. Якуба Коласа. Есть микрочип. Очень любит людей.', views: 67, city: 'Минск', address: 'ул. Якуба Коласа, 25', lat: 53.9123, lng: 27.5789, createdAt: new Date('2026-05-12') },
    { userId: users[4].id, type: AdType.LOST, status: AdStatus.APPROVED, petName: 'Снежок', animalType: 'Кролик', breed: 'Декоративный', color: 'Белый', description: 'Белый декоративный кролик выбежал из квартиры. Очень пугливый. Последний раз видели во дворе дома.', views: 34, city: 'Минск', address: 'пр. Независимости, 45', lat: 53.9234, lng: 27.6123, createdAt: new Date('2026-05-14') },
    // APPROVED - FOUND
    { userId: users[5].id, type: AdType.FOUND, status: AdStatus.APPROVED, petName: null, animalType: 'Собака', breed: 'Пудель', color: 'Белый', description: 'Найден белый пудель без ошейника около торгового центра. Ухоженный, явно домашний. Ищем хозяев. Временно у нас дома.', views: 56, city: 'Минск', address: 'ТЦ Galleria, пр. Победителей', lat: 53.9178, lng: 27.5234, createdAt: new Date('2026-05-13') },
    { userId: users[6].id, type: AdType.FOUND, status: AdStatus.APPROVED, petName: null, animalType: 'Кошка', breed: 'Не определена', color: 'Рыжий', description: 'Найдена рыжая кошка около подъезда. Очень ласковая, явно домашняя. Ест хорошо. Ищем хозяев срочно.', views: 78, city: 'Минск', address: 'ул. Притыцкого, 12', lat: 53.9067, lng: 27.4890, createdAt: new Date('2026-05-11') },
    { userId: users[7].id, type: AdType.FOUND, status: AdStatus.APPROVED, petName: null, animalType: 'Попугай', breed: 'Волнистый', color: 'Зелёный', description: 'Найден волнистый попугай зелёного цвета. Сидел на ветке дерева, дался в руки. Говорит несколько слов. Ищем хозяев.', views: 45, city: 'Минск', address: 'Ботанический сад', lat: 53.9345, lng: 27.6234, createdAt: new Date('2026-05-09') },
    // PENDING
    { userId: users[8].id, type: AdType.LOST, status: AdStatus.PENDING, petName: 'Барсик', animalType: 'Кошка', breed: 'Британская', color: 'Серый', description: 'Серый британский кот, пропал вчера вечером. Кастрирован, есть чип. Очень домашний, на улице не бывал.', views: 12, city: 'Минск', address: 'ул. Сурганова, 5', lat: 53.9289, lng: 27.5901, createdAt: new Date('2026-05-16') },
    { userId: users[9].id, type: AdType.FOUND, status: AdStatus.PENDING, petName: null, animalType: 'Собака', breed: 'Такса', color: 'Коричневый', description: 'Найдена такса коричневого окраса. Очень дружелюбная, на ошейнике нет номера. Временно у нас.', views: 8, city: 'Минск', address: 'Центральный ботанический сад', lat: 53.9312, lng: 27.6156, createdAt: new Date('2026-05-17') },
    // ARCHIVED (найдены)
    { userId: users[0].id, type: AdType.LOST, status: AdStatus.ARCHIVED, petName: 'Бобик', animalType: 'Собака', breed: 'Джек Рассел', color: 'Белый с пятнами', description: 'НАЙДЕН! Пропадал 3 дня, нашёлся благодаря объявлению на FindMe. Спасибо всем кто помогал!', views: 312, city: 'Минск', address: 'ул. Немига, 3', lat: 53.9034, lng: 27.5512, createdAt: new Date('2026-04-20') },
    { userId: users[1].id, type: AdType.LOST, status: AdStatus.ARCHIVED, petName: 'Снежка', animalType: 'Кошка', breed: 'Персидская', color: 'Белый', description: 'НАШЛАСЬ! Неделю искали, нашли через чат с соседом. Платформа очень помогла! Всем спасибо!', views: 445, city: 'Минск', address: 'ул. Комсомольская, 8', lat: 53.8978, lng: 27.5623, createdAt: new Date('2026-04-15') },
    { userId: users[2].id, type: AdType.LOST, status: AdStatus.ARCHIVED, petName: 'Малыш', animalType: 'Собака', breed: 'Той-терьер', color: 'Чёрный', description: 'НАШЁЛСЯ! Хозяева нашлись через 2 часа после публикации объявления. Невероятно быстро!', views: 189, city: 'Минск', address: 'пр. Машерова, 15', lat: 53.9156, lng: 27.5345, createdAt: new Date('2026-04-25') },
    // REJECTED
    { userId: users[3].id, type: AdType.LOST, status: AdStatus.REJECTED, petName: 'Тузик', animalType: 'Собака', breed: 'Дворняга', color: 'Коричневый', description: 'Тест объявления.', views: 2, city: 'Минск', address: 'ул. Тестовая', lat: 53.9000, lng: 27.5600, createdAt: new Date('2026-05-01') },
  ];

  const createdAds = [];
  for (const adData of adsData) {
    const { city, address, lat, lng, createdAt, ...rest } = adData;
    const ad = await prisma.ad.create({
      data: {
        ...rest,
        createdAt,
        updatedAt: createdAt,
        location: {
          create: { city, address, latitude: lat, longitude: lng },
        },
      },
    });
    createdAds.push(ad);
  }

  console.log(`✅ Создано ${createdAds.length} объявлений`);

  // ─── ЧАТЫ И СООБЩЕНИЯ ───────────────────────────────────────────────────────
  const approvedAds = createdAds.filter(a => a.status === AdStatus.APPROVED);

  const chat1 = await prisma.chat.create({
    data: {
      adId: approvedAds[0].id,
      user1Id: users[0].id,
      user2Id: users[5].id,
      createdAt: new Date('2026-05-15T19:00:00Z'),
    },
  });

  await prisma.message.createMany({
    data: [
      { chatId: chat1.id, senderId: users[5].id, content: 'Здравствуйте! Видел вашу собаку сегодня в парке Горького около 17:00', isRead: true, createdAt: new Date('2026-05-15T19:05:00Z') },
      { chatId: chat1.id, senderId: users[0].id, content: 'Правда?! Расскажите подробнее, пожалуйста! Это точно лабрадор рыжего цвета?', isRead: true, createdAt: new Date('2026-05-15T19:07:00Z') },
      { chatId: chat1.id, senderId: users[5].id, content: 'Да, рыжий лабрадор с синим ошейником. Бежал в сторону фонтана.', isRead: true, createdAt: new Date('2026-05-15T19:10:00Z') },
      { chatId: chat1.id, senderId: users[0].id, content: 'Огромное спасибо! Еду туда прямо сейчас!', isRead: false, createdAt: new Date('2026-05-15T19:12:00Z') },
    ],
  });

  const chat2 = await prisma.chat.create({
    data: {
      adId: approvedAds[1].id,
      user1Id: users[1].id,
      user2Id: users[6].id,
      createdAt: new Date('2026-05-10T14:00:00Z'),
    },
  });

  await prisma.message.createMany({
    data: [
      { chatId: chat2.id, senderId: users[6].id, content: 'Добрый день! Я видела серую кошку на ул. Ленина вчера вечером', isRead: true, createdAt: new Date('2026-05-10T14:05:00Z') },
      { chatId: chat2.id, senderId: users[1].id, content: 'Это точно она! Опишите подробнее, пожалуйста', isRead: true, createdAt: new Date('2026-05-10T14:08:00Z') },
      { chatId: chat2.id, senderId: users[6].id, content: 'Полосатая, серая, очень пугливая. Сидела под машиной.', isRead: true, createdAt: new Date('2026-05-10T14:10:00Z') },
      { chatId: chat2.id, senderId: users[1].id, content: 'Да, это точно Муся! Можете показать где именно?', isRead: true, createdAt: new Date('2026-05-10T14:15:00Z') },
      { chatId: chat2.id, senderId: users[6].id, content: 'Конечно, напишу адрес: ул. Ленина 10, двор со стороны арки', isRead: false, createdAt: new Date('2026-05-10T14:17:00Z') },
    ],
  });

  const chat3 = await prisma.chat.create({
    data: {
      adId: approvedAds[2].id,
      user1Id: users[2].id,
      user2Id: users[7].id,
      createdAt: new Date('2026-05-08T10:00:00Z'),
    },
  });

  await prisma.message.createMany({
    data: [
      { chatId: chat3.id, senderId: users[7].id, content: 'Привет! Видел хаски в Лошицком парке сегодня утром', isRead: true, createdAt: new Date('2026-05-08T10:05:00Z') },
      { chatId: chat3.id, senderId: users[2].id, content: 'Это Буран! Где именно в парке?', isRead: true, createdAt: new Date('2026-05-08T10:07:00Z') },
      { chatId: chat3.id, senderId: users[7].id, content: 'Около главного входа, бегал без поводка', isRead: false, createdAt: new Date('2026-05-08T10:09:00Z') },
    ],
  });

  const chat4 = await prisma.chat.create({
    data: {
      adId: approvedAds[5].id,
      user1Id: users[5].id,
      user2Id: users[8].id,
      createdAt: new Date('2026-05-13T16:00:00Z'),
    },
  });

  await prisma.message.createMany({
    data: [
      { chatId: chat4.id, senderId: users[8].id, content: 'Здравствуйте! Это наш пудель Арчи! Мы его ищем уже 2 дня!', isRead: true, createdAt: new Date('2026-05-13T16:05:00Z') },
      { chatId: chat4.id, senderId: users[5].id, content: 'Отлично! Приезжайте забирать, адрес напишу в личку', isRead: true, createdAt: new Date('2026-05-13T16:08:00Z') },
      { chatId: chat4.id, senderId: users[8].id, content: 'Спасибо огромное! Уже едем!', isRead: true, createdAt: new Date('2026-05-13T16:10:00Z') },
    ],
  });

  console.log('✅ Создано 4 чата с сообщениями');

  // ─── УВЕДОМЛЕНИЯ ────────────────────────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      { userId: users[0].id, type: NotificationType.AD_APPROVED, title: 'Объявление одобрено', message: 'Ваше объявление «Макс» опубликовано.', link: `/ads/${createdAds[0].id}`, isRead: true, createdAt: new Date('2026-05-15T12:00:00Z') },
      { userId: users[1].id, type: NotificationType.AD_APPROVED, title: 'Объявление одобрено', message: 'Ваше объявление «Муся» опубликовано.', link: `/ads/${createdAds[1].id}`, isRead: true, createdAt: new Date('2026-05-10T10:00:00Z') },
      { userId: users[2].id, type: NotificationType.AD_APPROVED, title: 'Объявление одобрено', message: 'Ваше объявление «Буран» опубликовано.', link: `/ads/${createdAds[2].id}`, isRead: false, createdAt: new Date('2026-05-08T09:00:00Z') },
      { userId: users[0].id, type: NotificationType.CHAT_MESSAGE, title: 'Новое сообщение', message: 'Мария Сидорова написала вам сообщение', link: `/chats/${chat1.id}`, isRead: false, createdAt: new Date('2026-05-15T19:05:00Z') },
      { userId: users[1].id, type: NotificationType.CHAT_MESSAGE, title: 'Новое сообщение', message: 'Александр Козлов написал вам сообщение', link: `/chats/${chat2.id}`, isRead: false, createdAt: new Date('2026-05-10T14:05:00Z') },
      { userId: users[8].id, type: NotificationType.AD_MODERATION_SUBMITTED, title: 'Объявление на модерации', message: 'Объявление «Барсик» принято и ожидает проверки.', link: `/ads/${createdAds[8].id}`, isRead: false, createdAt: new Date('2026-05-16T10:00:00Z') },
      { userId: users[3].id, type: NotificationType.AD_REJECTED, title: 'Объявление отклонено', message: 'Объявление «Тузик» отклонено. Причина: Недостаточно информации для публикации.', isRead: false, createdAt: new Date('2026-05-02T10:00:00Z') },
      { userId: users[0].id, type: NotificationType.AD_APPROVED, title: 'Объявление одобрено', message: 'Ваше объявление «Бобик» опубликовано.', link: `/ads/${createdAds[10].id}`, isRead: true, createdAt: new Date('2026-04-20T10:00:00Z') },
      { userId: users[4].id, type: NotificationType.AD_APPROVED, title: 'Объявление одобрено', message: 'Ваше объявление «Снежок» опубликовано.', link: `/ads/${createdAds[4].id}`, isRead: true, createdAt: new Date('2026-05-14T10:00:00Z') },
      { userId: users[5].id, type: NotificationType.CHAT_MESSAGE, title: 'Новое сообщение', message: 'Павел Зайцев написал вам сообщение', link: `/chats/${chat4.id}`, isRead: true, createdAt: new Date('2026-05-13T16:05:00Z') },
    ],
  });

  console.log('✅ Создано 10 уведомлений');

  // ─── ЖАЛОБЫ ─────────────────────────────────────────────────────────────────
  await prisma.complaint.createMany({
    data: [
      {
        reporterId: users[4].id,
        targetType: ComplaintTargetType.AD,
        adId: createdAds[13].id,
        reason: 'Подозрительное объявление',
        description: 'Объявление выглядит как спам, нет реальных данных о животном.',
        createdAt: new Date('2026-05-02T11:00:00Z'),
        updatedAt: new Date('2026-05-02T11:00:00Z'),
      },
      {
        reporterId: users[6].id,
        targetType: ComplaintTargetType.USER,
        targetUserId: users[9].id,
        reason: 'Подозрительное поведение',
        description: 'Пользователь не отвечает на сообщения и не приезжает за животным.',
        createdAt: new Date('2026-05-17T12:00:00Z'),
        updatedAt: new Date('2026-05-17T12:00:00Z'),
      },
    ],
  });

  console.log('✅ Создано 2 жалобы');

  // ─── ОБРАЩЕНИЯ В ПОДДЕРЖКУ ──────────────────────────────────────────────────
  await prisma.supportMessage.createMany({
    data: [
      { userId: users[3].id, senderId: users[3].id, text: 'Здравствуйте! Моё объявление было отклонено, но я не понимаю почему. Можете помочь?', createdAt: new Date('2026-05-03T10:00:00Z') },
      { userId: users[3].id, senderId: admin.id, text: 'Добрый день! Ваше объявление было отклонено из-за недостаточного описания. Пожалуйста, добавьте больше деталей о питомце и обстоятельствах пропажи.', createdAt: new Date('2026-05-03T11:00:00Z') },
      { userId: users[3].id, senderId: users[3].id, text: 'Понял, спасибо! Исправлю и отправлю снова.', createdAt: new Date('2026-05-03T11:30:00Z') },
      { userId: users[7].id, senderId: users[7].id, text: 'Как удалить своё объявление? Питомец уже нашёлся.', createdAt: new Date('2026-05-14T15:00:00Z') },
      { userId: users[7].id, senderId: admin.id, text: 'Здравствуйте! Перейдите в "Мои объявления", откройте нужное и нажмите кнопку "Питомец найден" или "Удалить". Рады, что питомец нашёлся!', createdAt: new Date('2026-05-14T15:30:00Z') },
    ],
  });

  console.log('✅ Создано 5 сообщений поддержки');

  // ─── ИТОГ ───────────────────────────────────────────────────────────────────
  const stats = {
    users: await prisma.user.count(),
    ads: await prisma.ad.count(),
    chats: await prisma.chat.count(),
    messages: await prisma.message.count(),
    notifications: await prisma.notification.count(),
    complaints: await prisma.complaint.count(),
  };

  console.log('\n📊 Итоговая статистика:');
  console.log(`   👤 Пользователей: ${stats.users}`);
  console.log(`   📋 Объявлений: ${stats.ads}`);
  console.log(`   💬 Чатов: ${stats.chats}`);
  console.log(`   ✉️  Сообщений: ${stats.messages}`);
  console.log(`   🔔 Уведомлений: ${stats.notifications}`);
  console.log(`   ⚠️  Жалоб: ${stats.complaints}`);
  console.log('\n🔑 Данные для входа:');
  console.log('   Админ:       admin@findme.by  / password123');
  console.log('   Пользователь: ivan@findme.by   / password123');
  console.log('\n✅ База данных успешно заполнена!');
}

main()
  .catch((e) => { console.error('❌ Ошибка:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
