-- Safe to run more than once.
create table if not exists users(id serial primary key,name varchar(255),email varchar(255),image text,points int not null default 0,elo int not null default 1000,pw text);
alter table users add column if not exists pw text;
create unique index if not exists users_email on users(email);
create table if not exists queue(id serial primary key,user_id int unique,ticket text,created_at timestamptz default now());
create table if not exists games(id text primary key,white int,black int,fen text,wms int,bms int,since bigint,status text default 'play',winner text,pending text);
