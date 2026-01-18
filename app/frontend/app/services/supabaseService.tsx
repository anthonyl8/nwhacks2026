import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = .env.local.VITE_SUPABASE_URL
const supabaseKey = .env.local.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

const [createSessionData, setCreateSessionData] = useState([]);
const [sessionInfoData, setSessionInfoData] = useState([]);

export async function getCreateSessionData() => {
    const { data } = await supabase.from("create_session").select();

    if (data.le)
}

export async function getSessionInfoData() => {

}

export async function getGoodMommentsData() => {

}

export async function addNewSessionDataToTable(newSessionData: any) => {

}