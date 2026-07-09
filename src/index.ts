import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { DocumentRegistry, IDocumentWidget } from '@jupyterlab/docregistry';
import { DisposableDelegate, IDisposable } from '@lumino/disposable';
import { BoxLayout, Widget } from '@lumino/widgets';

/**
 * A widget extension that inserts a full-width bar showing the document's
 * path directly above the content of any document widget (notebook, text
 * editor, image viewer, CSV, ...).
 *
 * It is registered against the `'*'` factory, so a single implementation
 * covers every document type: they all derive from `DocumentWidget` and
 * expose a `context` carrying `path` / `pathChanged`.
 */
class PathBarExtension
  implements
    DocumentRegistry.IWidgetExtension<
      IDocumentWidget,
      DocumentRegistry.IModel
    >
{
  createNew(
    widget: IDocumentWidget,
    context: DocumentRegistry.IContext<DocumentRegistry.IModel>
  ): IDisposable {
    const bar = new Widget();
    bar.addClass('jp-PathBar');

    const update = () => {
      // `context.path` is the full server-relative path; empty for a
      // not-yet-saved untitled document until the first save.
      bar.node.textContent = context.path;
      bar.node.title = context.path;
    };
    update();
    context.pathChanged.connect(update);

    // The DocumentWidget lays out [toolbar, content] in a BoxLayout.
    // Insert the bar at index 1 so it sits between them.
    const layout = widget.layout as BoxLayout;
    layout.insertWidget(1, bar);
    BoxLayout.setStretch(bar, 0);

    return new DisposableDelegate(() => {
      context.pathChanged.disconnect(update);
      bar.dispose();
    });
  }
}

/**
 * Initialization data for the jupyterlab_ext_pathbar extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_ext_pathbar:plugin',
  description:
    'Extension to JupyterLab that displays the path to a document above the content editor/viewer.',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    app.docRegistry.addWidgetExtension('*', new PathBarExtension());
    console.log('JupyterLab extension jupyterlab_ext_pathbar is activated!');
  }
};

export default plugin;
