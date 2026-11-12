create table if not exists users(id serial primary key,name varchar(255),email varchar(255),"emailVerified" timestamptz,image text,points int not null default 0,elo int not null default 1000);
create table if not exists accounts(id serial primary key,"userId" int not null,type varchar(255) not null,provider varchar(255) not null,"providerAccountId" varchar(255) not null,refresh_token text,access_token text,expires_at bigint,id_token text,scope text,session_state text,token_type text);
create table if not exists sessions(id serial primary key,"userId" int not null,expires timestamptz not null,"sessionToken" varchar(255) not null);
create table if not exists verification_token(identifier text not null,expires timestamptz not null,token text not null,primary key(identifier,token));
create table if not exists queue(id serial primary key,user_id int unique,ticket text,created_at timestamptz default now());
create table if not exists games(id text primary key,white int,black int,fen text,wms int,bms int,since bigint,status text default 'play',winner text,pending text);
