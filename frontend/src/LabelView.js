// @ts-ignore
import React from 'react';
import { useState } from 'react';
import Form from 'react-bootstrap/Form'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Modal from 'react-bootstrap/Modal';

import * as JSZip from 'jszip';
import * as tf from '@tensorflow/tfjs';

import Popover from 'react-bootstrap/Popover'
import './App.css';
import Label from './Label.js';
import Cam from './Cam.js';
import Button from 'react-bootstrap/Button';

import plus from'./images/plus.png';
import { Link } from 'react-router-dom';

import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';


class LabelView extends React.Component {
    constructor(props) {
        super(props)
        this.handleNewImage = this.handleNewImage.bind(this)
        this.handleRemoveImage = this.handleRemoveImage.bind(this)
        this.handleRemoveLabel = this.handleRemoveLabel.bind(this)
        this.handleLabelKeyDown = this.handleLabelKeyDown.bind(this)
        this.createNewLabel = this.createNewLabel.bind(this)
        this.tuneModal = this.tuneModal.bind(this)
        this.uploadData = this.uploadData.bind(this)
        this.uploadModel = this.uploadModel.bind(this)
        this.handleData = this.handleData.bind(this)
        this.handleModel = this.handleModel.bind(this)

        this.modelInputRef = React.createRef()
        this.dataInputRef = React.createRef()

        this.state = { 
            imageMap: this.props.location.state === undefined ? {} : this.props.location.state.imageMap,
        }
    }


    downloadURI(uri, name) {
        let link = document.createElement("a");
        link.download = name;
        link.href = uri;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    handleNewImage(image, currentLabel) {
        this.setState({
            imageMap: {
                ...this.state.imageMap,
                [currentLabel]: [...this.state.imageMap[currentLabel], image]
            }
        });
    }

    handleRemoveLabel(labelToRemove) {
        let newImageMap = {}
        let newCur;
        Object.keys(this.state.imageMap).forEach((label) => {
            if(labelToRemove !== label) {
                newImageMap[label] = this.state.imageMap[label];
                newCur = label;
            }
        })
        this.setState({
            imageMap: newImageMap,
            currentLabel: newCur
        });
    }

    handleRemoveImage(i, name) {
        let images = [...(this.state.imageMap[name])]
        let index = images.indexOf(i)
        if (index !== -1) {
            images.splice(index, 1);
            this.setState({imageMap: {
                ...this.state.imageMap,
                [name]: images
            }});
        }
    }

    handleLabelKeyDown(e) {
        if(e.keyCode === 13) {
            this.createNewLabel(e.target.value)
            document.body.click()
        }
    }

    createNewLabel(labelName) {
        this.setState({imageMap: {
            ...this.state.imageMap,
            [labelName]: []
        }, currentLabel: labelName})
    }

    uploadModel() {
        this.modelInputRef.current.click()
    }

    uploadData() {
        this.dataInputRef.current.click()
    }

    async handleModel() {
        try {
            const zip = new JSZip();
            let data = await zip.loadAsync(this.modelInputRef.current.files[0]);
            const weightData = new File([await data.files['model.weights.bin'].async('blob')], "model.weights.bin");
            const topologyWeightsJSON = new File([await data.files['model.json'].async('blob')], "model.json");
            console.log(weightData);
            console.log(topologyWeightsJSON);
            const loadedModel = await tf.loadLayersModel(tf.io.browserFiles([topologyWeightsJSON, weightData]));
            loadedModel.summary();
            console.log(loadedModel);
            this.setState({loadedModel: loadedModel});
        } catch (error) {
            alert('Incorrect upload format.');
        }
    }

    async handleData() {
        try{
            const zip = new JSZip();
            let data = await zip.loadAsync(this.dataInputRef.current.files[0]);
            console.log(data)
            const loadedMap = JSON.parse(await data.files['images.json'].async('string'))
            this.setState({imageMap: loadedMap});
        } catch(error) {
            alert('Incorrect upload format.');
        }
        
    }

    tuneModal() {
        const [show, setShow] = useState(false);
        const handleClose = () => setShow(false);
        const handleShow = () => setShow(true);
        return (
          <>
            <Button 
                variant="dark" 
                size="sm" 
                className="train-button" 
                onClick={handleShow} 
                disabled={Object.keys(this.state.imageMap).length > 0 && Math.min(...Object.keys(this.state.imageMap).map(k => this.state.imageMap[k].length)) > 0 ? false : true}
            >
                自定义
            </Button>
              <Link to={{ pathname: "/test", state: {imageMap: this.state.imageMap, loadedModel: this.state.loadedModel}}}>
                  <Button variant="dark"
                          size="sm"
                          className="train-button"
                          disabled={Object.keys(this.state.imageMap).length > 0 && Math.min(...Object.keys(this.state.imageMap).map(k => this.state.imageMap[k].length)) > 0 ? false : true}>
                      训练
                  </Button>
              </Link>
            <Modal show={show} onHide={handleClose} centered>
                <Modal.Header closeButton>
                    <Modal.Title>自定义超参数</Modal.Title>
                </Modal.Header>
                <Modal.Body></Modal.Body>
                <Form>
                    <Form.Group controlId="exampleForm.ControlInput1">
                        <Form.Label>学习率</Form.Label>
                        <Form.Control type="number" defaultValue="0.0001" step=".0001" />
                    </Form.Group>
                    <Form.Group controlId="exampleForm.ControlSelect1">
                        <Form.Label>优化器</Form.Label>
                        <Form.Control as="select">
                        <option>Adam</option>
                        <option>SGD</option>
                        <option>Adagrad</option>
                        <option>Adadelta</option>
                        </Form.Control>
                    </Form.Group>
                    <Form.Group controlId="exampleForm.ControlInput2">
                        <Form.Label>轮数</Form.Label>
                        <Form.Control type="number" defaultValue="20" step="1" />
                    </Form.Group>
                    <Form.Group controlId="exampleForm.ControlInput2">
                        <Form.Label>训练数据比例</Form.Label>
                        <Form.Control type="number" defaultValue=".4" step=".1" />
                    </Form.Group>
                </Form>
                <Modal.Footer>
                <Button variant="danger" onClick={handleClose}>
                    关闭
                </Button>
                <Link to={{ pathname: "/test", state: {imageMap: this.state.imageMap, loadedModel: this.state.loadedModel}}}>
                    <Button variant="warning">训练模型</Button>
                </Link>
                </Modal.Footer>
            </Modal>
          </>
        );
    }

    render () {
        return (
            <header className="App-header">
                <Navbar bg="dark" variant="dark">
                    <Navbar.Brand href="/">自定义图像分类器</Navbar.Brand>
                    <Nav className="mr-auto">
                        <Link to={{ pathname: "/", state: {imageMap: this.state.imageMap}}}>
                            训练
                        </Link>
                        <Link to={{ pathname: "/test", state: {imageMap: this.state.imageMap}}} className={Object.keys(this.state.imageMap).length > 0 && Math.min(...Object.keys(this.state.imageMap).map(k => this.state.imageMap[k].length)) > 1 ? "": "disable-link"}>
                            测试
                        </Link>
                    </Nav>
                </Navbar>
                <div className="page-title">训练页面</div>
                <p className="page-info">点击以下+加号图标添加一个分类，然后点击采集图像按钮或选择本地图片拖动到分类框中，你也可以通过以下按钮上传之前生成的模型或图像数据集。完成后点击“训练”按钮。
                </p>
                <div className="view-all">
                <Cam 
                    handleNewImage={this.handleNewImage}
                    allLabels={Object.keys(this.state.imageMap)}
                    currentLabel={this.state.currentLabel}
                />
                <div className="all-labels">
                    <div className="plus-wrapper">
                        <OverlayTrigger
                            trigger="click"
                            placement={"right"}
                            rootClose={true}
                            overlay={
                                <Popover>
                                    <Popover.Title 
                                        as="h3">{"新建分类"}</Popover.Title>
                                    <Popover.Content>
                                    <input 
                                        type="text" 
                                        name="name" 
                                        autoFocus={true} 
                                        onKeyDown={this.handleLabelKeyDown}
                                    />
                                    </Popover.Content>
                                </Popover>
                            }
                        >
                            <img src={plus} alt="plus" className="plus"></img>
                        </OverlayTrigger>
                        {Object.keys(this.state.imageMap).length > 0  && <this.tuneModal/>}
                    </div>
                    {Object.keys(this.state.imageMap).map(k => {
                        return (
                            <Label 
                                name={k}
                                images={this.state.imageMap[k]}
                                handleNewImage={this.handleNewImage}
                                handleRemoveImage={this.handleRemoveImage}
                                handleRemoveLabel={this.handleRemoveLabel}
                                key={k}/>
                        )
                    })}
                </div>
            </div>
            <div>
                <Button variant={"dark"} className="train-button" onClick={this.uploadModel}>上传模型</Button>
                <input type="file" id="modelFile" onInput={this.handleModel} ref={this.modelInputRef} style={{display: "none"}}/>
                <Button variant={"dark"} className="train-button" onClick={this.uploadData}>上传数据集</Button>
                <input type="file" id="dataFile" onInput={this.handleData} ref={this.dataInputRef} style={{display: "none"}}/>
            </div>
            </header>
        )
    }
}

export default LabelView;
