import {useEffect, useState} from "react";
import {Helmet} from "react-helmet-async";
import HomeBar from "../../components/misc/HomeBar.tsx";
import Animation from "../../components/misc/Animation.tsx";

export const TournamentRulesPage = () => {
    const [rules, setRules] = useState<string>("");

    useEffect(() => {
        const fetchRules = async () => {
            try {
                const response = await fetch("https://api.rankedin.com/v1/tournament/GetRegulationsAsync?id=44703");
                const text = await response.text();
                setRules(text);
            } catch (error) {
                console.error("Error fetching rules:", error);
            }
        }
        fetchRules().then();
    }, []);


    return (
        <>
            <Helmet>
                <title>Turneringsregler</title>
            </Helmet>

            <HomeBar />
            <Animation>
            <div className="my-5 p-4" dangerouslySetInnerHTML={{__html: rules}}/>
            </Animation>
        </>
    );
};

export default TournamentRulesPage;