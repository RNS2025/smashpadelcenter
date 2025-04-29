import {useEffect, useState} from "react";
import {Helmet} from "react-helmet-async";

export const TournamentRegulationsTab = () => {
    const [regulations, setRegulations] = useState<string>("");

    //TODO: Hent turnerings-ID dynamisk
    useEffect(() => {
        const fetchRules = async () => {
            try {
                const response = await fetch("https://api.rankedin.com/v1/tournament/GetRegulationsAsync?id=44703");
                const text = await response.text();
                const cleanedText = text.replace(/^"|"$/g, '');
                setRegulations(cleanedText);
            } catch (error) {
                console.error("Error fetching rules:", error);
            }
        };
        fetchRules().then();
    }, []);



    return (
        <>
            <Helmet>
                <title>Generelt</title>
            </Helmet>
        <div className="p-4 sm:justify-self-center prose prose-invert" dangerouslySetInnerHTML={{__html: regulations}}/>
        </>
    )

}