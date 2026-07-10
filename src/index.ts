import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { MainAreaWidget } from '@jupyterlab/apputils';
import { DocumentRegistry, IDocumentWidget } from '@jupyterlab/docregistry';
import { DisposableDelegate, IDisposable } from '@lumino/disposable';
import { Widget } from '@lumino/widgets';

/**
 * CSS class applied to the path bar widget.
 */
const PATH_BAR_CLASS = 'jp-jupyterlab-ext-pathbar-bar';

/**
 * A widget extension that inserts a full-width bar showing the document's
 * path directly above the content of any document widget (notebook, text
 * editor, image viewer, CSV, ...).
 *
 * A single instance is registered against every concrete widget factory
 * (see {@link activate}); each document type derives from `DocumentWidget`
 * (a `MainAreaWidget`) and exposes a `context` carrying `path` / `pathChanged`.
 */
class PathBarExtension
  implements
    DocumentRegistry.IWidgetExtension<
      IDocumentWidget,
      DocumentRegistry.IModel
    >
{
  /**
   * Create a path bar for a newly opened document widget.
   * @param widget - The document widget being created.
   * @param context - The document context (source of the path).
   */
  createNew(
    widget: IDocumentWidget,
    context: DocumentRegistry.IContext<DocumentRegistry.IModel>
  ): IDisposable {
    const bar = new Widget();
    bar.addClass(PATH_BAR_CLASS);

    const update = () => {
      // `context.path` is the full server-relative path; empty for a
      // not-yet-saved untitled document until the first save.
      bar.node.textContent = context.path;
      bar.node.title = context.path;
    };
    update();
    context.pathChanged.connect(update);

    // `MainAreaWidget.contentHeader` is a BoxPanel purpose-built for widgets
    // that sit between the toolbar and the content, so the bar lands directly
    // above the editor/viewer without any layout-index assumptions.
    if (widget instanceof MainAreaWidget) {
      widget.contentHeader.addWidget(bar);
    } else {
      // No known place to attach the bar; drop it rather than leak the node.
      bar.dispose();
    }

    return new DisposableDelegate(() => {
      context.pathChanged.disconnect(update);
      bar.dispose();
    });
  }
}

/**
 * Register the path bar extension against every widget factory currently
 * known to the registry, and against any factory registered afterwards.
 *
 * The document registry has no `'*'` wildcard for widget extensions: they are
 * stored and looked up per concrete (lowercased) factory name, so a single
 * `addWidgetExtension('*', ...)` call would never run. Registering per factory
 * is the supported way to cover all document types.
 *
 * @param app - JupyterLab application instance.
 */
function activate(app: JupyterFrontEnd): void {
  const { docRegistry } = app;
  const extension = new PathBarExtension();

  for (const factory of docRegistry.widgetFactories()) {
    docRegistry.addWidgetExtension(factory.name, extension);
  }

  // Cover widget factories contributed later by other extensions.
  docRegistry.changed.connect((_, args) => {
    if (
      args.type === 'widgetFactory' &&
      args.change === 'added' &&
      args.name
    ) {
      docRegistry.addWidgetExtension(args.name, extension);
    }
  });
}

/**
 * Initialization data for the jupyterlab_ext_pathbar extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_ext_pathbar:plugin',
  description:
    'Extension to JupyterLab that displays the path to a document above the content editor/viewer.',
  autoStart: true,
  activate
};

export default plugin;
