import "./globals.css";
import {Cinzel} from "next/font/google";
const cz = Cinzel({subsets: ["latin"], variable: "--cz"});
export const metadata = {title: "Chess — Think • Move • Win"};
export default function L({children}: any) { return <html lang="en"><body className={cz.variable}>{children}</body></html>; }
