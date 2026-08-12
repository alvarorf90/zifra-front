import React from "react";

const Generar = () => {

    return (

        <div
            style={{
                width: "100%",
                height: "calc(100vh - 70px)",
                overflow: "hidden"
            }}
        >

            <iframe
                title="Regulatorio ATS"
                src="http://190.56.246.163:8080/regulatorio/ats"
                width="100%"
                height="100%"
                frameBorder="0"
                style={{
                    border: "none"
                }}
            />

        </div>

    );

};

export default Generar;