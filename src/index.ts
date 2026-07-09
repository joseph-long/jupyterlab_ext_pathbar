import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

/**
 * Initialization data for the jupyterlab_ext_pathbar extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_ext_pathbar:plugin',
  description: 'Extension to JupyterLab that displays the path to a document above the content editor/viewer.',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension jupyterlab_ext_pathbar is activated!');
  }
};

export default plugin;
