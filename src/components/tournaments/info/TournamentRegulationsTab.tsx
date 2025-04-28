import {useEffect, useState} from "react";
import {Helmet} from "react-helmet-async";

export const TournamentRegulationsTab = () => {
    const [regulations, setRegulations] = useState<string>("");

    useEffect(() => {
        const fetchRules = async () => {
            try {
                const response = await fetch("https://api.rankedin.com/v1/tournament/GetRegulationsAsync?id=44703");
                const text = await response.text();
                setRegulations(text);
            } catch (error) {
                console.error("Error fetching rules:", error);
            }
        }
        fetchRules().then();
    }, []);



    return (
        <>
            <Helmet>
                <title>Generelt</title>
            </Helmet>
        <div className="my-5 p-4" dangerouslySetInnerHTML={{__html: regulations}}/>
        </>
    )

}