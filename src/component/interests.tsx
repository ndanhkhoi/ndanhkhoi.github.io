import React from 'react';
import {List} from 'reactstrap';

const Interests: React.FC<{interests: Array<String>}> = ({interests}) => {

    return (
        <section className="skills-section py-3">
            <h3 className="text-uppercase resume-section-heading mb-4">Interests</h3>
            <List type="unstyled" className="resume-interests-list mb-0">
                {
                    interests.map((interest, idx) => {
                        return (
                            <li key={idx} className="mb-2">{interest}</li>
                        );
                    })
                }
            </List>
        </section>
    );

}

export default Interests;