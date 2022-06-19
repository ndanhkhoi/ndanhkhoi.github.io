import React from 'react';
import {faEnvelopeSquare, faGlobe, faMapMarker, faPhoneSquare} from '@fortawesome/free-solid-svg-icons';
import {Col, List, Row} from 'reactstrap';
import IPersonalInfomation from '../model/personal-infomation.model';
import {ListItem} from '../component';

export interface IResumeHeaderProps {
    personalInfomation: IPersonalInfomation
}


const ResumeHeader: React.FC<IResumeHeaderProps> = props => {

    return (
        <div className="resume-header">
            <Row className="align-items-center">
                <Col md={6} lg={8} xl={9} className="resume-title col-12">
                    <h2 className="resume-name mb-0 text-uppercase">{props.personalInfomation?.fullName}</h2>
                    <div className="resume-tagline mb-3 mb-md-0">{props.personalInfomation?.jobTitle}</div>
                </Col>
                <Col className="resume-contact col-12 col-md-6 col-lg-4 col-xl-3">
                    <List type="unstyled" className={'mb-0'}>
                        <ListItem icon={faPhoneSquare}>
                            <a className="resume-link" href="tel:#">{props.personalInfomation?.phoneNumber}</a>
                        </ListItem>
                        <ListItem icon={faEnvelopeSquare}>
                            <a className="resume-link" href="mailto:#">{props.personalInfomation?.email}</a>
                        </ListItem>
                        <ListItem icon={faGlobe}>
                            <a className="resume-link" href={props.personalInfomation?.website}>{props.personalInfomation?.website}</a>
                        </ListItem>
                        <ListItem icon={faMapMarker}>
                            {props.personalInfomation?.address}
                        </ListItem>
                    </List>
                </Col>
            </Row>
        </div>
    );

}

export default ResumeHeader;