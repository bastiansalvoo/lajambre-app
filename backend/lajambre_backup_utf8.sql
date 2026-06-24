--
-- PostgreSQL database dump
--

\restrict Ru1sfFC25qB39xizMv8Q5MR0749A3v0rhvq0Q3ZXaVqn5SmyPMr4dTDocgIzdfd

-- Dumped from database version 15.17 (Debian 15.17-1.pgdg13+1)
-- Dumped by pg_dump version 15.17 (Debian 15.17-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: user_lajambre
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'PENDIENTE',
    'PAGADO',
    'EN_CAMINO',
    'ENTREGADO',
    'CANCELADO',
    'PREPARANDO'
);


ALTER TYPE public."OrderStatus" OWNER TO user_lajambre;

--
-- Name: PointTransactionType; Type: TYPE; Schema: public; Owner: user_lajambre
--

CREATE TYPE public."PointTransactionType" AS ENUM (
    'EARNED',
    'REDEEMED',
    'EXPIRED'
);


ALTER TYPE public."PointTransactionType" OWNER TO user_lajambre;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: user_lajambre
--

CREATE TYPE public."Role" AS ENUM (
    'USER',
    'ADMIN'
);


ALTER TYPE public."Role" OWNER TO user_lajambre;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Category; Type: TABLE; Schema: public; Owner: user_lajambre
--

CREATE TABLE public."Category" (
    id integer NOT NULL,
    name text NOT NULL
);


ALTER TABLE public."Category" OWNER TO user_lajambre;

--
-- Name: Category_id_seq; Type: SEQUENCE; Schema: public; Owner: user_lajambre
--

CREATE SEQUENCE public."Category_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Category_id_seq" OWNER TO user_lajambre;

--
-- Name: Category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user_lajambre
--

ALTER SEQUENCE public."Category_id_seq" OWNED BY public."Category".id;


--
-- Name: Extra; Type: TABLE; Schema: public; Owner: user_lajambre
--

CREATE TABLE public."Extra" (
    id integer NOT NULL,
    name text NOT NULL,
    price integer NOT NULL,
    "isAvailable" boolean DEFAULT true NOT NULL
);


ALTER TABLE public."Extra" OWNER TO user_lajambre;

--
-- Name: Extra_id_seq; Type: SEQUENCE; Schema: public; Owner: user_lajambre
--

CREATE SEQUENCE public."Extra_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Extra_id_seq" OWNER TO user_lajambre;

--
-- Name: Extra_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user_lajambre
--

ALTER SEQUENCE public."Extra_id_seq" OWNED BY public."Extra".id;


--
-- Name: Order; Type: TABLE; Schema: public; Owner: user_lajambre
--

CREATE TABLE public."Order" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    status public."OrderStatus" DEFAULT 'PENDIENTE'::public."OrderStatus" NOT NULL,
    total integer NOT NULL,
    "deliveryFee" integer DEFAULT 1250 NOT NULL,
    "buyOrder" text,
    "sessionId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "pointsEarned" integer DEFAULT 0 NOT NULL,
    "pointsUsed" integer DEFAULT 0 NOT NULL,
    "rewardType" text,
    "contactPhone" text,
    "deliveryAddress" text
);


ALTER TABLE public."Order" OWNER TO user_lajambre;

--
-- Name: OrderItem; Type: TABLE; Schema: public; Owner: user_lajambre
--

CREATE TABLE public."OrderItem" (
    id integer NOT NULL,
    "orderId" integer NOT NULL,
    "productId" integer NOT NULL,
    quantity integer NOT NULL,
    "priceAtPurchase" integer NOT NULL
);


ALTER TABLE public."OrderItem" OWNER TO user_lajambre;

--
-- Name: OrderItemExtra; Type: TABLE; Schema: public; Owner: user_lajambre
--

CREATE TABLE public."OrderItemExtra" (
    id integer NOT NULL,
    "orderItemId" integer NOT NULL,
    "extraId" integer NOT NULL,
    "priceAtPurchase" integer NOT NULL
);


ALTER TABLE public."OrderItemExtra" OWNER TO user_lajambre;

--
-- Name: OrderItemExtra_id_seq; Type: SEQUENCE; Schema: public; Owner: user_lajambre
--

CREATE SEQUENCE public."OrderItemExtra_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."OrderItemExtra_id_seq" OWNER TO user_lajambre;

--
-- Name: OrderItemExtra_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user_lajambre
--

ALTER SEQUENCE public."OrderItemExtra_id_seq" OWNED BY public."OrderItemExtra".id;


--
-- Name: OrderItem_id_seq; Type: SEQUENCE; Schema: public; Owner: user_lajambre
--

CREATE SEQUENCE public."OrderItem_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."OrderItem_id_seq" OWNER TO user_lajambre;

--
-- Name: OrderItem_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user_lajambre
--

ALTER SEQUENCE public."OrderItem_id_seq" OWNED BY public."OrderItem".id;


--
-- Name: Order_id_seq; Type: SEQUENCE; Schema: public; Owner: user_lajambre
--

CREATE SEQUENCE public."Order_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Order_id_seq" OWNER TO user_lajambre;

--
-- Name: Order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user_lajambre
--

ALTER SEQUENCE public."Order_id_seq" OWNED BY public."Order".id;


--
-- Name: PointTransaction; Type: TABLE; Schema: public; Owner: user_lajambre
--

CREATE TABLE public."PointTransaction" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "orderId" integer,
    points integer NOT NULL,
    type public."PointTransactionType" NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PointTransaction" OWNER TO user_lajambre;

--
-- Name: PointTransaction_id_seq; Type: SEQUENCE; Schema: public; Owner: user_lajambre
--

CREATE SEQUENCE public."PointTransaction_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."PointTransaction_id_seq" OWNER TO user_lajambre;

--
-- Name: PointTransaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user_lajambre
--

ALTER SEQUENCE public."PointTransaction_id_seq" OWNED BY public."PointTransaction".id;


--
-- Name: Product; Type: TABLE; Schema: public; Owner: user_lajambre
--

CREATE TABLE public."Product" (
    id integer NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    price integer NOT NULL,
    image text,
    "isAvailable" boolean DEFAULT true NOT NULL,
    "categoryId" integer NOT NULL
);


ALTER TABLE public."Product" OWNER TO user_lajambre;

--
-- Name: Product_id_seq; Type: SEQUENCE; Schema: public; Owner: user_lajambre
--

CREATE SEQUENCE public."Product_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Product_id_seq" OWNER TO user_lajambre;

--
-- Name: Product_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user_lajambre
--

ALTER SEQUENCE public."Product_id_seq" OWNED BY public."Product".id;


--
-- Name: User; Type: TABLE; Schema: public; Owner: user_lajambre
--

CREATE TABLE public."User" (
    id integer NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    address text,
    role public."Role" DEFAULT 'USER'::public."Role" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "pointsBalance" integer DEFAULT 0 NOT NULL,
    "isVerified" boolean DEFAULT false NOT NULL,
    "verificationToken" text
);


ALTER TABLE public."User" OWNER TO user_lajambre;

--
-- Name: User_id_seq; Type: SEQUENCE; Schema: public; Owner: user_lajambre
--

CREATE SEQUENCE public."User_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."User_id_seq" OWNER TO user_lajambre;

--
-- Name: User_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user_lajambre
--

ALTER SEQUENCE public."User_id_seq" OWNED BY public."User".id;


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: user_lajambre
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO user_lajambre;

--
-- Name: Category id; Type: DEFAULT; Schema: public; Owner: user_lajambre
--

ALTER TABLE ONLY public."Category" ALTER COLUMN id SET DEFAULT nextval('public."Category_id_seq"'::regclass);


--
-- Name: Extra id; Type: DEFAULT; Schema: public; Owner: user_lajambre
--

ALTER TABLE ONLY public."Extra" ALTER COLUMN id SET DEFAULT nextval('public."Extra_id_seq"'::regclass);


--
-- Name: Order id; Type: DEFAULT; Schema: public; Owner: user_lajambre
--

ALTER TABLE ONLY public."Order" ALTER COLUMN id SET DEFAULT nextval('public."Order_id_seq"'::regclass);


--
-- Name: OrderItem id; Type: DEFAULT; Schema: public; Owner: user_lajambre
--

ALTER TABLE ONLY public."OrderItem" ALTER COLUMN id SET DEFAULT nextval('public."OrderItem_id_seq"'::regclass);


--
-- Name: OrderItemExtra id; Type: DEFAULT; Schema: public; Owner: user_lajambre
--

ALTER TABLE ONLY public."OrderItemExtra" ALTER COLUMN id SET DEFAULT nextval('public."OrderItemExtra_id_seq"'::regclass);


--
-- Name: PointTransaction id; Type: DEFAULT; Schema: public; Owner: user_lajambre
--

ALTER TABLE ONLY public."PointTransaction" ALTER COLUMN id SET DEFAULT nextval('public."PointTransaction_id_seq"'::regclass);


--
-- Name: Product id; Type: DEFAULT; Schema: public; Owner: user_lajambre
--

ALTER TABLE ONLY public."Product" ALTER COLUMN id SET DEFAULT nextval('public."Product_id_seq"'::regclass);


--
-- Name: User id; Type: DEFAULT; Schema: public; Owner: user_lajambre
--

ALTER TABLE ONLY public."User" ALTER COLUMN id SET DEFAULT nextval('public."User_id_seq"'::regclass);


--
-- Data for Name: Category; Type: TABLE DATA; Schema: public; Owner: user_lajambre
--

COPY public."Category" (id, name) FROM stdin;
1	Hamburguesas
2	Bebidas
\.


--
-- Data for Name: Extra; Type: TABLE DATA; Schema: public; Owner: user_lajambre
--

COPY public."Extra" (id, name, price, "isAvailable") FROM stdin;
1	Carne Extra	2000	t
2	Salsa Lajambre Extra	500	t
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: user_lajambre
--

COPY public."Order" (id, "userId", status, total, "deliveryFee", "buyOrder", "sessionId", "createdAt", "updatedAt", "pointsEarned", "pointsUsed", "rewardType", "contactPhone", "deliveryAddress") FROM stdin;
1	2	PENDIENTE	2250	1250	\N	\N	2026-04-29 15:03:46.956	2026-04-29 15:03:46.982	0	0	\N	999999999	Direcci├│n por definir
2	2	PENDIENTE	2250	1250	\N	\N	2026-04-29 15:27:45.754	2026-04-29 15:27:45.759	0	0	\N	945231223	Calle Los boldos
3	2	PENDIENTE	9240	1250	ORD-3-615	01ab967d487c29a4c60633c03c465c95e37c30293d9a4a5ae761c45e28b89537	2026-04-29 15:39:04.535	2026-04-29 15:39:04.908	0	0	\N	956565656	Los Boldos
4	2	PENDIENTE	9740	1250	ORD-4-147	01ab121626b68bf9f0b783d994ff76cbec55163b6989a943450949911c737236	2026-04-29 15:42:34.393	2026-04-29 15:42:34.633	0	0	\N	956565656	Los Boldos
5	2	PENDIENTE	10040	1250	ORD-5-913	01ab3a26cf93e35abfdba4381ae3e0675ef88301db87296611f8f501b6f55702	2026-04-29 15:46:36.5	2026-04-29 15:46:36.77	0	0	\N	956565656	Los Boldos
6	2	PENDIENTE	9240	1250	ORD-6-502	01ab587859d6e2f011c4962bfc6deb3581e03171440b640398e72af64fa6ad3b	2026-04-29 15:53:00.153	2026-04-29 15:53:00.471	0	0	\N	9565232356	Los Boldos
7	2	PENDIENTE	4482	1250	ORD-7-143	01abb9ad635da9fdb096acf5fe4836e59ae7fcf7fedb9dc34088c4a0b8315fed	2026-04-29 16:01:02.828	2026-04-29 16:01:03.106	0	0	\N	956325632	Los Boldos
8	2	PENDIENTE	9540	1250	ORD-8-759	01abd9646daf7ba8d63ec69709f5782562e24979adea52bd5565df60c5fc5be1	2026-04-29 16:11:06.88	2026-04-29 16:11:07.211	0	0	\N	956235632	Las vi├▒as
9	2	ENTREGADO	11250	1250	ORD-9-282	01ab9135fb6444c5f230b75dd05cb1cbb73873428138393b829d33eb6f0d6585	2026-04-29 16:18:53.523	2026-04-30 03:43:52.107	112	0	\N	23232323	Uuuuj
10	2	PAGADO	11540	1250	ORD-10-114	01ab0926b36394225ba35a3d529f99be4d708d70c2003e1df0e0c2aeb3211431	2026-04-30 14:13:47.445	2026-04-30 14:14:55.462	115	0	\N	322313262	Los Boldos
11	5	PENDIENTE	21530	1250	ORD-11-293	01ab0ec025ee5e98f4ff900b24e4043789e26924c531e076a34b7ce75e79cb4c	2026-05-01 16:27:38.682	2026-05-01 16:27:39.024	0	0	\N	956521221	Las bi├▒as 209
12	5	ENTREGADO	10040	1250	ORD-12-621	01ab4a62fe3ed1af52f6793bc9d0065ec8d0d8152027d5764304a3035135698c	2026-05-01 16:38:41.373	2026-05-01 16:41:12.244	100	0	\N	656565646	Jsjskd
13	5	PREPARANDO	11540	1250	ORD-13-737	01ab84fd012b02c54255b652150cc4a448c9992b79792b6502f29c6039153d4a	2026-05-01 17:12:46.418	2026-05-01 17:18:15.404	115	0	\N	956522312	Calle
14	5	PAGADO	10540	1250	ORD-14-454	01ab2229efa8cffa97cdde36299e41e2fc486f841e715079233cecb845b6277f	2026-05-01 17:42:57.586	2026-05-01 17:43:48.953	105	150	BEBIDA_GRATIS	956523212	Los boldos 789
\.


--
-- Data for Name: OrderItem; Type: TABLE DATA; Schema: public; Owner: user_lajambre
--

COPY public."OrderItem" (id, "orderId", "productId", quantity, "priceAtPurchase") FROM stdin;
1	1	6	1	1000
2	2	6	1	1000
3	3	1	1	7990
4	4	2	1	8490
5	5	4	1	8790
6	6	1	1	7990
8	8	5	1	8290
10	10	5	1	8290
11	11	5	1	8290
12	11	1	1	7990
13	12	5	1	8290
14	13	5	1	8290
15	14	5	1	8290
\.


--
-- Data for Name: OrderItemExtra; Type: TABLE DATA; Schema: public; Owner: user_lajambre
--

COPY public."OrderItemExtra" (id, "orderItemId", "extraId", "priceAtPurchase") FROM stdin;
1	10	1	2000
2	11	1	2000
3	12	1	2000
4	13	2	500
5	14	1	2000
6	15	1	2000
\.


--
-- Data for Name: PointTransaction; Type: TABLE DATA; Schema: public; Owner: user_lajambre
--

COPY public."PointTransaction" (id, "userId", "orderId", points, type, "expiresAt", "createdAt") FROM stdin;
1	2	9	112	EARNED	2026-07-28 16:19:44.68	2026-04-29 16:19:44.689
2	2	10	115	EARNED	2026-07-29 14:14:55.457	2026-04-30 14:14:55.465
3	5	12	100	EARNED	2026-07-30 16:39:43.888	2026-05-01 16:39:43.895
4	5	13	115	EARNED	2026-07-30 17:13:48.443	2026-05-01 17:13:48.447
5	5	14	-150	REDEEMED	\N	2026-05-01 17:42:57.597
6	5	14	105	EARNED	2026-07-30 17:43:48.948	2026-05-01 17:43:48.954
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: user_lajambre
--

COPY public."Product" (id, name, description, price, image, "isAvailable", "categoryId") FROM stdin;
5	Mostaza-Miel	Dulce, sabrosa y perfectamente equilibrada. Hamburguesa de 150g de carne especial, con salsa mostaza-miel Lajambre, lechuga fresca, queso gouda, cebolla caramelizada, pepinillos laminados y tocino crocante, todo en pan artesanal.	8290	product-1777097336397-182268571.jpeg	t	1
6	Lata de Bebida	Agrega una lata de bebida a tu pedido!	1000	product-1777595253553-2606582.jpeg	t	2
1	Cl├ísica	Nuestra esencia hecha burger. Hamburguesa de 150g de carne especial, con salsa Lajambre, lechuga fresca, pepinillos, tomate, doble queso cheddar, cebolla morada y tocino crocante, todo en pan artesanal.	7990	product-1777097347803-692381116.jpeg	t	1
4	Triplecheese	Intensa, cremosa y con car├ícter. Hamburguesa de 150g de carne especial, con toque suave de salsa Lajambre, lechuga, pepinillos, cebolla salteada al vino blanco, mezcla cremosa de gouda, cheddar y queso azul terminando con tocino en el tope, todo en pan artesanal.	8790	product-1777097364439-329488253.jpeg	t	1
2	La de Palta	La favorita de los que aman lo cremoso con car├ícter. Hamburguesa de 150g de carne especial, con salsa Lajambre, lechuga, pepinillos, doble queso cheddar, palta molida especiada, huevo frito y cebolla morada, todo en pan artesanal.	8490	product-1777097379275-480327561.jpeg	t	1
3	BBQ	Para los que buscan sabor ahumado y contundente. Hamburguesa de 150g de carne especial, con salsa BBQ, champi├▒ones salteados, cebolla caramelizada, tocino, doble queso cheddar y toque final de salsa especial Lajambre, todo en pan artesanal!!	8990	product-1777097261505-360723489.jpeg	t	1
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: user_lajambre
--

COPY public."User" (id, email, password, name, phone, address, role, "createdAt", "updatedAt", "pointsBalance", "isVerified", "verificationToken") FROM stdin;
1	admin@lajambre.cl	$2b$10$xRq0gpNoFSTpsb2UTLyPF.D7xp2D4BUf71xMiJtE1ivD7bgm7Y/vC	Angelo (Admin)	+5692158434	\N	ADMIN	2026-04-25 05:54:27.837	2026-04-25 05:54:27.837	0	t	\N
2	bastiansalvosepulveda@gmail.com	$2b$10$ze.sKO6KWwBuJG1cIQ54leVgmj3xaaEFPwJcYk8ConytxquwljJGO	Bastian Salvo	+5695454646	\N	USER	2026-04-29 06:19:56.228	2026-04-30 14:14:55.464	227	t	\N
3	bastisepulveda777@gmail.com	$2b$10$G2SwJ.hbD6NrhQzpLikgneieC2iTEh.7CYoJS/Lkn2I7Zp9yDQRqm	Ignacio Salvo	+56945534917	\N	USER	2026-04-30 17:00:32.503	2026-04-30 17:01:45.087	0	t	\N
4	bastisepulveda2@gmail.com	$2b$10$rdWCgWbf1uZm9O8XUqdK2OKZqp.MVPlozkGXqDOKIU7yoI8PHnAsu	Richard Salvo 	956523212	\N	USER	2026-05-01 00:31:13.363	2026-05-01 00:31:13.363	0	f	1b5d352631b24ab41ff5944849f76e80b79d0bdd
5	bastianreal81@gmail.com	$2b$10$DKIzry8OAC879VN5N2fviOX4XDkmBglNHaE7M6lBnRKbxY/prtgNu	Angelo Cliente	956322154	\N	USER	2026-05-01 00:32:51.661	2026-05-01 17:43:48.954	170	t	\N
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: user_lajambre
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
6f3ddcb0-bb30-47bf-8bb6-84299abc8d1e	9f3224b953b9e3a847cb5a914e4053f8a0933c280a39bb303297053fbca45e82	2026-04-25 05:28:07.345121+00	20260326165048_init	\N	\N	2026-04-25 05:28:07.284643+00	1
1f912f20-38bd-4993-8b14-7787ed669e07	3952f0943101c4394fed1f8e3f50630194783f52484acc59aac4fa1d06ad2dab	2026-04-25 05:28:07.368382+00	20260328000004_add_is_available	\N	\N	2026-04-25 05:28:07.346896+00	1
f276854c-c8df-4966-9e80-30bc5d0c83d0	9f85cc50d751bb8b987ee5c9c526fda77330284515cca70eb91be30dbbf3b2fe	2026-04-25 05:28:38.486386+00	20260425052838_recuperacion_puerto	\N	\N	2026-04-25 05:28:38.461363+00	1
\.


--
-- Name: Category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user_lajambre
--

SELECT pg_catalog.setval('public."Category_id_seq"', 2, true);


--
-- Name: Extra_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user_lajambre
--

SELECT pg_catalog.setval('public."Extra_id_seq"', 2, true);


--
-- Name: OrderItemExtra_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user_lajambre
--

SELECT pg_catalog.setval('public."OrderItemExtra_id_seq"', 6, true);


--
-- Name: OrderItem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user_lajambre
--

SELECT pg_catalog.setval('public."OrderItem_id_seq"', 15, true);


--
-- Name: Order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user_lajambre
--

SELECT pg_catalog.setval('public."Order_id_seq"', 14, true);


--
-- Name: PointTransaction_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user_lajambre
--

SELECT pg_catalog.setval('public."PointTransaction_id_seq"', 6, true);


--
-- Name: Product_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user_lajambre
--

SELECT pg_catalog.setval('public."Product_id_seq"', 8, true);


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user_lajambre
--

SELECT pg_catalog.setval('public."User_id_seq"', 5, true);


--
-- Name: Category Category_pkey; Type: CONSTRAINT; Schema: public; Owner: user_lajambre
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (id);


--
-- Name: Extra Extra_pkey; Type: CONSTRAINT; Schema: public; Owner: user_lajambre
--

ALTER TABLE ONLY public."Extra"
    ADD CONSTRAINT "Extra_pkey" PRIMARY KEY (id);


--
-- Name: OrderItemExtra OrderItemExtra_pkey; Type: CONSTRAINT; Schema: public; Owner: user_lajambre
--

ALTER TABLE ONLY public."OrderItemExtra"
    ADD CONSTRAINT "OrderItemExtra_pkey" PRIMARY KEY (id);


--
-- Name: OrderItem OrderItem_pkey; Type: CONSTRAINT; Schema: public; Owner: user_lajambre
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_pkey" PRIMARY KEY (id);


--
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: public; Owner: user_lajambre
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);


--
-- Name: PointTransaction PointTransaction_pkey; Type: CONSTRAINT; Schema: public; Owner: user_lajambre
--

ALTER TABLE ONLY public."PointTransaction"
    ADD CONSTRAINT "PointTransaction_pkey" PRIMARY KEY (id);


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: user_lajambre
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: user_lajambre
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: user_lajambre
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: OrderItemExtra_extraId_idx; Type: INDEX; Schema: public; Owner: user_lajambre
--

CREATE INDEX "OrderItemExtra_extraId_idx" ON public."OrderItemExtra" USING btree ("extraId");


--
-- Name: OrderItemExtra_orderItemId_idx; Type: INDEX; Schema: public; Owner: user_lajambre
--

CREATE INDEX "OrderItemExtra_orderItemId_idx" ON public."OrderItemExtra" USING btree ("orderItemId");


--
-- Name: OrderItem_orderId_idx; Type: INDEX; Schema: public; Owner: user_lajambre
--

CREATE INDEX "OrderItem_orderId_idx" ON public."OrderItem" USING btree ("orderId");


--
-- Name: OrderItem_productId_idx; Type: INDEX; Schema: public; Owner: user_lajambre
--

CREATE INDEX "OrderItem_productId_idx" ON public."OrderItem" USING btree ("productId");


--
-- Name: Order_buyOrder_key; Type: INDEX; Schema: public; Owner: user_lajambre
--

CREATE UNIQUE INDEX "Order_buyOrder_key" ON public."Order" USING btree ("buyOrder");


--
-- Name: Order_userId_idx; Type: INDEX; Schema: public; Owner: user_lajambre
--

CREATE INDEX "Order_userId_idx" ON public."Order" USING btree ("userId");


--
-- Name: PointTransaction_userId_idx; Type: INDEX; Schema: public; Owner: user_lajambre
--

CREATE INDEX "PointTransaction_userId_idx" ON public."PointTransaction" USING btree ("userId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: user_lajambre
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: OrderItemExtra OrderItemExtra_extraId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user_lajambre
--

ALTER TABLE ONLY public."OrderItemExtra"
    ADD CONSTRAINT "OrderItemExtra_extraId_fkey" FOREIGN KEY ("extraId") REFERENCES public."Extra"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OrderItemExtra OrderItemExtra_orderItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user_lajambre
--

ALTER TABLE ONLY public."OrderItemExtra"
    ADD CONSTRAINT "OrderItemExtra_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES public."OrderItem"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OrderItem OrderItem_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user_lajambre
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OrderItem OrderItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user_lajambre
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Order Order_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user_lajambre
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PointTransaction PointTransaction_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user_lajambre
--

ALTER TABLE ONLY public."PointTransaction"
    ADD CONSTRAINT "PointTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PointTransaction PointTransaction_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user_lajambre
--

ALTER TABLE ONLY public."PointTransaction"
    ADD CONSTRAINT "PointTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Product Product_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user_lajambre
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict Ru1sfFC25qB39xizMv8Q5MR0749A3v0rhvq0Q3ZXaVqn5SmyPMr4dTDocgIzdfd

