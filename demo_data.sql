-- Demo data for FindMe platform
-- This script fills the database with test data for video demonstration

-- Clear existing data (optional - uncomment if needed)
-- DELETE FROM "AdPhoto";
-- DELETE FROM "Message";
-- DELETE FROM "Chat";
-- DELETE FROM "Location";
-- DELETE FROM "Complaint";
-- DELETE FROM "Notification";
-- DELETE FROM "SupportMessage";
-- DELETE FROM "Ad";
-- DELETE FROM "NotificationSettings";
-- DELETE FROM "RefreshToken";
-- DELETE FROM "EmailVerificationToken";
-- DELETE FROM "PasswordResetToken";
-- DELETE FROM "TelegramLinkToken";
-- DELETE FROM "User";

-- Insert test users
INSERT INTO "User" (id, email, "passwordHash", name, phone, "telegramUsername", "avatarUrl", role, "emailVerifiedAt", "createdAt", "updatedAt") VALUES
-- Admin user
('admin-user-id-123', 'admin@findme.by', '$2b$10$rQZ9QmjlVQZ9QmjlVQZ9QO', 'Администратор FindMe', '+375291234567', 'findme_admin', NULL, 'ADMIN', NOW(), NOW(), NOW()),

-- Regular users
('user-1-id-123', 'ivan.petrov@gmail.com', '$2b$10$rQZ9QmjlVQZ9QmjlVQZ9QO', 'Иван Петров', '+375291234001', 'ivan_pet', NULL, 'USER', NOW(), NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
('user-2-id-123', 'maria.sidorova@yandex.by', '$2b$10$rQZ9QmjlVQZ9QmjlVQZ9QO', 'Мария Сидорова', '+375291234002', 'maria_s', NULL, 'USER', NOW(), NOW() - INTERVAL '10 days', NOW() - INTERVAL '3 days'),
('user-3-id-123', 'alex.kozlov@mail.ru', '$2b$10$rQZ9QmjlVQZ9QmjlVQZ9QO', 'Александр Козлов', '+375291234003', 'alex_kozlov', NULL, 'USER', NOW(), NOW() - INTERVAL '15 days', NOW() - INTERVAL '1 day'),
('user-4-id-123', 'elena.volko@gmail.com', '$2b$10$rQZ9QmjlVQZ9QmjlVQZ9QO', 'Елена Волко', '+375291234004', 'elena_v', NULL, 'USER', NOW(), NOW() - INTERVAL '20 days', NOW() - INTERVAL '2 days'),
('user-5-id-123', 'dmitry.kravchuk@tut.by', '$2b$10$rQZ9QmjlVQZ9QmjlVQZ9QO', 'Дмитрий Кравчук', '+375291234005', 'dmitry_k', NULL, 'USER', NOW(), NOW() - INTERVAL '7 days', NOW() - INTERVAL '1 day'),
('user-6-id-123', 'svetlana.popova@gmail.com', '$2b$10$rQZ9QmjlVQZ9QmjlVQZ9QO', 'Светлана Попова', '+375291234006', 'svetlana_p', NULL, 'USER', NOW(), NOW() - INTERVAL '12 days', NOW() - INTERVAL '4 days'),
('user-7-id-123', 'andrey.novak@yandex.ru', '$2b$10$rQZ9QmjlVQZ9QmjlVQZ9QO', 'Андрей Новак', '+375291234007', 'andrey_nov', NULL, 'USER', NOW(), NOW() - INTERVAL '8 days', NOW() - INTERVAL '1 day'),
('user-8-id-123', 'natasha.belik@mail.ru', '$2b$10$rQZ9QmjlVQZ9QmjlVQZ9QO', 'Наталья Белик', '+375291234008', 'natasha_b', NULL, 'USER', NOW(), NOW() - INTERVAL '18 days', NOW() - INTERVAL '2 days'),
('user-9-id-123', 'sergey.mishenko@gmail.com', '$2b$10$rQZ9QmjlVQZ9QmjlVQZ9QO', 'Сергей Мищенко', '+375291234009', 'sergey_m', NULL, 'USER', NOW(), NOW() - INTERVAL '6 days', NOW() - INTERVAL '1 day'),
('user-10-id-123', 'oksana.loginova@tut.by', '$2b$10$rQZ9QmjlVQZ9QmjlVQZ9QO', 'Оксана Логинова', '+375291234010', 'oksana_l', NULL, 'USER', NOW(), NOW() - INTERVAL '14 days', NOW() - INTERVAL '3 days');

-- Insert notification settings for all users
INSERT INTO "NotificationSettings" ("userId", "notifyWeb", "notifyTelegram", "createdAt") 
SELECT id, true, true, NOW() FROM "User";

-- Insert test ads (mix of LOST and FOUND, different statuses)
INSERT INTO "Ad" (id, "userId", type, status, "petName", "animalType", breed, color, description, views, "createdAt", "updatedAt") VALUES
-- Recent LOST pets (APPROVED)
('ad-1-lost-cat', 'user-1-id-123', 'LOST', 'APPROVED', 'Мурзик', 'Кот', 'Британская короткошерстная', 'Серый', 'Пропал серый британец Мурзик, очень ласковый и спокойный. Носит красный ошейник. Откликается на имя. Очень скучаем, помогите найти!', 45, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
('ad-2-lost-dog', 'user-2-id-123', 'LOST', 'APPROVED', 'Бэлла', 'Собака', 'Лабрадор', 'Золотистый', 'Потерялась золотистая лабрадор Бэлла, 3 года. Очень дружелюбная, любит детей. На ошейнике есть жетон с номером телефона. Пропала в районе парка Горького.', 67, NOW() - INTERVAL '1 day', NOW() - INTERVAL '12 hours'),
('ad-3-lost-cat', 'user-3-id-123', 'LOST', 'APPROVED', 'Симба', 'Кот', 'Мейн-кун', 'Рыжий', 'Пропал рыжий мейн-кун Симба, крупный кот, очень пушистый. Характерная особенность - белое пятно на груди. Кастрированный, домашний, на улице не выживет.', 89, NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days'),

-- FOUND pets (APPROVED)
('ad-4-found-dog', 'user-4-id-123', 'FOUND', 'APPROVED', NULL, 'Собака', 'Дворняжка', 'Чёрно-белый', 'Найдена молодая собака, примерно 1-2 года, чёрно-белого окраса. Очень активная и дружелюбная. Найдена возле остановки "Центральная". Ищем хозяев или добрые руки.', 34, NOW() - INTERVAL '1 day', NOW() - INTERVAL '8 hours'),
('ad-5-found-cat', 'user-5-id-123', 'FOUND', 'APPROVED', NULL, 'Кошка', 'Персидская', 'Белый', 'Найдена белая персидская кошка, очень пушистая и ухоженная. Явно домашняя, приучена к лотку. Найдена на улице Ленина. Временно у нас дома, ищем хозяев.', 28, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '2 hours'),

-- Happy endings (ARCHIVED - found pets)
('ad-6-found-home', 'user-6-id-123', 'LOST', 'ARCHIVED', 'Рекс', 'Собака', 'Немецкая овчарка', 'Чёрно-коричневый', 'Потерялся Рекс - немецкая овчарка, 5 лет. НАЙДЕН! Огромное спасибо всем, кто помогал в поисках! Рекс дома, здоров и счастлив!', 156, NOW() - INTERVAL '10 days', NOW() - INTERVAL '2 days'),
('ad-7-found-home', 'user-7-id-123', 'LOST', 'ARCHIVED', 'Мася', 'Кошка', 'Сиамская', 'Кремовый с темными ушами', 'Пропала сиамская кошка Мася. НАЙДЕНА! Спасибо девушке, которая нашла её и связалась через наш сайт. Мася дома!', 203, NOW() - INTERVAL '15 days', NOW() - INTERVAL '5 days'),
('ad-8-found-home', 'user-8-id-123', 'FOUND', 'ARCHIVED', NULL, 'Кролик', 'Декоративный', 'Серо-белый', 'Найден декоративный кролик возле школы №15. Хозяева нашлись! Малыш дома, всё хорошо. Спасибо платформе FindMe!', 78, NOW() - INTERVAL '8 days', NOW() - INTERVAL '3 days'),

-- More recent ads
('ad-9-lost-dog', 'user-9-id-123', 'LOST', 'APPROVED', 'Джек', 'Собака', 'Джек Рассел терьер', 'Бело-коричневый', 'Пропал Джек Рассел терьер по кличке Джек. Небольшой, очень энергичный. Убежал во время прогулки в лесопарке. Очень переживаем, это член семьи!', 23, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '3 hours'),
('ad-10-found-cat', 'user-10-id-123', 'FOUND', 'APPROVED', NULL, 'Котёнок', 'Обычный', 'Трёхцветный', 'Найден совсем маленький трёхцветный котёнок, примерно 2-3 месяца. Очень слабый, сейчас на лечении у ветеринара. Ищем маму или добрых хозяев.', 67, NOW() - INTERVAL '12 hours', NOW() - INTERVAL '6 hours'),

-- Some pending moderation
('ad-11-pending', 'user-1-id-123', 'LOST', 'PENDING', 'Барсик', 'Кот', 'Обычный', 'Серый полосатый', 'Пропал кот Барсик, серый полосатый. Кастрированный, домашний. Очень ласковый, к людям идёт. Район Серебрянка.', 0, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
('ad-12-pending', 'user-3-id-123', 'FOUND', 'PENDING', NULL, 'Попугай', 'Волнистый', 'Зелёно-жёлтый', 'Найден волнистый попугайчик, говорит несколько слов. Найден на балконе 5 этажа. Временно в клетке, ищем хозяев.', 0, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour');

-- Insert locations for ads
INSERT INTO "Location" (id, "adId", address, city, latitude, longitude) VALUES
('loc-1', 'ad-1-lost-cat', 'ул. Притыцкого, 156', 'Минск', 53.9045, 27.5615),
('loc-2', 'ad-2-lost-dog', 'Парк Горького', 'Минск', 53.9006, 27.5590),
('loc-3', 'ad-3-lost-cat', 'пр-т Независимости, 65', 'Минск', 53.9074, 27.5873),
('loc-4', 'ad-4-found-dog', 'остановка "Центральная"', 'Минск', 53.9024, 27.5618),
('loc-5', 'ad-5-found-cat', 'ул. Ленина, 12', 'Минск', 53.9033, 27.5647),
('loc-6', 'ad-6-found-home', 'микрорайон Серебрянка', 'Минск', 53.8794, 27.4607),
('loc-7', 'ad-7-found-home', 'ул. Каменгорская, 8', 'Минск', 53.9283, 27.6434),
('loc-8', 'ad-8-found-home', 'возле школы №15', 'Минск', 53.8889, 27.5489),
('loc-9', 'ad-9-lost-dog', 'Лесопарк', 'Минск', 53.8756, 27.5123),
('loc-10', 'ad-10-found-cat', 'ул. Якуба Коласа, 37', 'Минск', 53.9190, 27.5856),
('loc-11', 'ad-11-pending', 'район Серебрянка', 'Минск', 53.8800, 27.4600),
('loc-12', 'ad-12-pending', 'ул. Богдановича, 155', 'Минск', 53.9123, 27.5432);

-- Insert placeholder photos (you'll replace URLs with real images later)
INSERT INTO "AdPhoto" (id, "adId", "photoUrl", "createdAt") VALUES
-- Photos for lost cat Murzik
('photo-1-1', 'ad-1-lost-cat', 'https://via.placeholder.com/400x300/808080/FFFFFF?text=Murzik+1', NOW() - INTERVAL '2 days'),
('photo-1-2', 'ad-1-lost-cat', 'https://via.placeholder.com/400x300/808080/FFFFFF?text=Murzik+2', NOW() - INTERVAL '2 days'),

-- Photos for lost dog Bella
('photo-2-1', 'ad-2-lost-dog', 'https://via.placeholder.com/400x300/FFD700/000000?text=Bella+1', NOW() - INTERVAL '1 day'),
('photo-2-2', 'ad-2-lost-dog', 'https://via.placeholder.com/400x300/FFD700/000000?text=Bella+2', NOW() - INTERVAL '1 day'),

-- Photos for lost cat Simba  
('photo-3-1', 'ad-3-lost-cat', 'https://via.placeholder.com/400x300/FF6347/FFFFFF?text=Simba+1', NOW() - INTERVAL '3 days'),

-- Photos for found dog
('photo-4-1', 'ad-4-found-dog', 'https://via.placeholder.com/400x300/000000/FFFFFF?text=Found+Dog', NOW() - INTERVAL '1 day'),

-- Photos for found cat
('photo-5-1', 'ad-5-found-cat', 'https://via.placeholder.com/400x300/FFFFFF/000000?text=Found+Cat', NOW() - INTERVAL '4 hours'),

-- Photos for archived (happy endings)
('photo-6-1', 'ad-6-found-home', 'https://via.placeholder.com/400x300/8B4513/FFFFFF?text=Rex+Home', NOW() - INTERVAL '10 days'),
('photo-7-1', 'ad-7-found-home', 'https://via.placeholder.com/400x300/F5DEB3/000000?text=Masya+Home', NOW() - INTERVAL '15 days'),
('photo-8-1', 'ad-8-found-home', 'https://via.placeholder.com/400x300/C0C0C0/000000?text=Rabbit+Home', NOW() - INTERVAL '8 days'),

-- Recent ads photos
('photo-9-1', 'ad-9-lost-dog', 'https://via.placeholder.com/400x300/D2691E/FFFFFF?text=Jack+Lost', NOW() - INTERVAL '6 hours'),
('photo-10-1', 'ad-10-found-cat', 'https://via.placeholder.com/400x300/FF69B4/000000?text=Kitten+Found', NOW() - INTERVAL '12 hours'),

-- Pending ads photos
('photo-11-1', 'ad-11-pending', 'https://via.placeholder.com/400x300/696969/FFFFFF?text=Barsik+Pending', NOW() - INTERVAL '2 hours'),
('photo-12-1', 'ad-12-pending', 'https://via.placeholder.com/400x300/32CD32/000000?text=Parrot+Found', NOW() - INTERVAL '1 hour');

-- Insert chats between users
INSERT INTO "Chat" (id, "adId", "user1Id", "user2Id", "createdAt") VALUES
('chat-1', 'ad-1-lost-cat', 'user-1-id-123', 'user-4-id-123', NOW() - INTERVAL '1 day'),
('chat-2', 'ad-2-lost-dog', 'user-2-id-123', 'user-5-id-123', NOW() - INTERVAL '6 hours'),
('chat-3', 'ad-4-found-dog', 'user-4-id-123', 'user-3-id-123', NOW() - INTERVAL '12 hours'),
('chat-4', 'ad-5-found-cat', 'user-5-id-123', 'user-6-id-123', NOW() - INTERVAL '2 hours'),
('chat-5', 'ad-6-found-home', 'user-6-id-123', 'user-7-id-123', NOW() - INTERVAL '3 days');

-- Insert messages in chats
INSERT INTO "Message" (id, "chatId", "senderId", content, "isRead", "createdAt") VALUES
-- Chat 1: About lost cat Murzik
('msg-1-1', 'chat-1', 'user-4-id-123', 'Здравствуйте! Видела похожего кота в районе ул. Кальварийская. Может быть, это ваш Мурзик?', true, NOW() - INTERVAL '1 day'),
('msg-1-2', 'chat-1', 'user-1-id-123', 'О боже! Спасибо огромное! Можете скинуть фото или точное место где видели?', true, NOW() - INTERVAL '23 hours'),
('msg-1-3', 'chat-1', 'user-4-id-123', 'Конечно! Это было возле магазина "Соседи", кот сидел под машиной. Серый, пушистый.', true, NOW() - INTERVAL '22 hours'),
('msg-1-4', 'chat-1', 'user-1-id-123', 'Еду туда сейчас! Держите за меня кулачки 🤞', false, NOW() - INTERVAL '20 hours'),

-- Chat 2: About lost dog Bella
('msg-2-1', 'chat-2', 'user-5-id-123', 'Добрый день! В парке Горького действительно видел золотистую собаку, но без ошейника.', true, NOW() - INTERVAL '6 hours'),
('msg-2-2', 'chat-2', 'user-2-id-123', 'Спасибо за отклик! Ошейник мог слететь. Где именно в парке?', true, NOW() - INTERVAL '5 hours'),
('msg-2-3', 'chat-2', 'user-5-id-123', 'Возле большой детской площадки, собака играла с детьми. Очень дружелюбная.', false, NOW() - INTERVAL '4 hours'),

-- Chat 3: About found dog
('msg-3-1', 'chat-3', 'user-3-id-123', 'Привет! Это может быть моя собака! Как долго она у вас?', true, NOW() - INTERVAL '12 hours'),
('msg-3-2', 'chat-3', 'user-4-id-123', 'Нашли вчера вечером. Собачка очень хорошая, накормили, напоили. Есть какие-то особые приметы?', true, NOW() - INTERVAL '11 hours'),
('msg-3-3', 'chat-3', 'user-3-id-123', 'У неё должно быть маленькое родимое пятнышко на левой лапке, и она знает команду "дай лапу"', true, NOW() - INTERVAL '10 hours'),
('msg-3-4', 'chat-3', 'user-4-id-123', 'Точно! И пятнышко есть, и лапу даёт! Приезжайте скорее, она вас ждёт! 😊', false, NOW() - INTERVAL '9 hours'),

-- Chat 4: About found cat
('msg-4-1', 'chat-4', 'user-6-id-123', 'Здравствуйте! Возможно, это наша кошка Снежка. Пропала 3 дня назад.', true, NOW() - INTERVAL '2 hours'),
('msg-4-2', 'chat-4', 'user-5-id-123', 'Здравствуйте! Расскажите поподробнее о вашей кошке, чтобы убедиться.', false, NOW() - INTERVAL '1 hour'),

-- Chat 5: Success story
('msg-5-1', 'chat-5', 'user-7-id-123', 'Добрый день! Видел ваше объявление о пропавшей собаке. Кажется, нашёл её!', true, NOW() - INTERVAL '3 days'),
('msg-5-2', 'chat-5', 'user-6-id-123', 'Неужели?! Где нашли? Как она?', true, NOW() - INTERVAL '3 days'),
('msg-5-3', 'chat-5', 'user-7-id-123', 'Всё отлично! Она здоровая, только немного голодная была. Приезжайте!', true, NOW() - INTERVAL '3 days'),
('msg-5-4', 'chat-5', 'user-6-id-123', 'Спасибо вам огромное! Не знаю, как отблагодарить! 🙏❤️', true, NOW() - INTERVAL '2 days');

-- Insert notifications
INSERT INTO "Notification" (id, "userId", type, title, message, link, "isRead", "createdAt") VALUES
('notif-1', 'user-1-id-123', 'CHAT_MESSAGE', 'Новое сообщение', 'Елена написала вам по объявлению о Мурзике', '/chats/chat-1', false, NOW() - INTERVAL '20 hours'),
('notif-2', 'user-2-id-123', 'CHAT_MESSAGE', 'Новое сообщение', 'Дмитрий ответил по объявлению о Бэлле', '/chats/chat-2', false, NOW() - INTERVAL '4 hours'),
('notif-3', 'user-4-id-123', 'CHAT_MESSAGE', 'Новое сообщение', 'Александр написал по объявлению о найденной собаке', '/chats/chat-3', false, NOW() - INTERVAL '9 hours'),
('notif-4', 'user-6-id-123', 'AD_APPROVED', 'Объявление одобрено', 'Ваше объявление о найденном Рексе было одобрено и опубликовано', '/ads/ad-6-found-home', true, NOW() - INTERVAL '2 days'),
('notif-5', 'user-1-id-123', 'AD_APPROVED', 'Объявление одобрено', 'Ваше объявление о потерявшемся Мурзике одобрено и опубликовано', '/ads/ad-1-lost-cat', true, NOW() - INTERVAL '2 days');

-- Insert some complaints for demo
INSERT INTO "Complaint" (id, "reporterId", "targetType", "adId", reason, description, status, "createdAt") VALUES
('complaint-1', 'user-5-id-123', 'AD', 'ad-11-pending', 'Неподходящий контент', 'Объявление содержит неточную информацию о породе', 'PENDING', NOW() - INTERVAL '1 hour'),
('complaint-2', 'user-6-id-123', 'USER', NULL, 'Спам', 'Пользователь отправляет одинаковые сообщения многим', 'RESOLVED', NOW() - INTERVAL '2 days');
UPDATE "Complaint" SET "targetUserId" = 'user-3-id-123' WHERE id = 'complaint-2';

-- Insert support messages
INSERT INTO "SupportMessage" (id, "userId", "senderId", text, "createdAt") VALUES
('support-1', 'user-2-id-123', 'user-2-id-123', 'Здравствуйте! Не могу загрузить фотографии к объявлению. Что делать?', NOW() - INTERVAL '5 hours'),
('support-2', 'user-2-id-123', 'admin-user-id-123', 'Добрый день! Попробуйте уменьшить размер изображений или используйте другой формат (JPG, PNG).', NOW() - INTERVAL '4 hours'),
('support-3', 'user-7-id-123', 'user-7-id-123', 'Как отметить объявление как закрытое, если питомец нашёлся?', NOW() - INTERVAL '2 days'),
('support-4', 'user-7-id-123', 'admin-user-id-123', 'В разделе "Мои объявления" есть кнопка "Архивировать". Нажмите её, когда питомец найдётся.', NOW() - INTERVAL '2 days');

-- Update some ads with more realistic view counts
UPDATE "Ad" SET views = 156 WHERE id = 'ad-6-found-home';
UPDATE "Ad" SET views = 203 WHERE id = 'ad-7-found-home';
UPDATE "Ad" SET views = 78 WHERE id = 'ad-8-found-home';
UPDATE "Ad" SET views = 89 WHERE id = 'ad-3-lost-cat';
UPDATE "Ad" SET views = 67 WHERE id = 'ad-2-lost-dog';

-- Set some messages as unread for demo
UPDATE "Message" SET "isRead" = false WHERE id IN ('msg-1-4', 'msg-2-3', 'msg-3-4', 'msg-4-2');

COMMIT;

-- Summary report
SELECT 
    'Users' as entity, COUNT(*) as count FROM "User"
UNION ALL
SELECT 'Ads (Total)', COUNT(*) FROM "Ad"
UNION ALL  
SELECT 'Ads (APPROVED)', COUNT(*) FROM "Ad" WHERE status = 'APPROVED'
UNION ALL
SELECT 'Ads (ARCHIVED)', COUNT(*) FROM "Ad" WHERE status = 'ARCHIVED'  
UNION ALL
SELECT 'Ads (PENDING)', COUNT(*) FROM "Ad" WHERE status = 'PENDING'
UNION ALL
SELECT 'Photos', COUNT(*) FROM "AdPhoto"
UNION ALL
SELECT 'Chats', COUNT(*) FROM "Chat"
UNION ALL
SELECT 'Messages', COUNT(*) FROM "Message"
UNION ALL
SELECT 'Notifications', COUNT(*) FROM "Notification"
UNION ALL
SELECT 'Complaints', COUNT(*) FROM "Complaint";